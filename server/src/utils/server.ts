import http, { IncomingMessage, OutgoingMessage } from "http";
import { Socket } from "net";

import { activeConnections, activeRequests } from "./prometheus";

export const SERVER_CONTEXT = "Server";

import logger from "../logger";
import { HOST, IS_TEST_ENV, PORT } from "../config";

export class ServerExtension {
  private server: http.Server;
  private serverAddress: string;

  private mapConnections: Map<Socket, number>;
  private sentConnectionClose: WeakMap<Socket, boolean>;

  private terminating: boolean;

  private activeRequestCount: number;
  private activeConnections: number;

  constructor(server: http.Server) {
    this.server = server;

    this.serverAddress = "";
    this.terminating = true;

    this.mapConnections = new Map();
    this.sentConnectionClose = new WeakMap();

    this.activeConnections = 0;
    this.activeRequestCount = 0;

    this.server.on("request", this.startRequest.bind(this));
    this.server.on("connection", this.trackConnections.bind(this));
  }

  private trackConnections(socket: Socket): void {
    this.activeConnections++;
    activeConnections.inc(1);
    this.mapConnections.set(socket, 0);
    socket.once("close", () => {
      this.activeConnections--;
      activeConnections.dec(1);
      this.mapConnections.delete(socket);
    });
  }

  private endAllConnections(force: boolean): void {
    this.mapConnections.forEach((count, socket) => {
      if (force || count === 0) {
        socket.end();
      }
    });
  }

  private startRequest(req: IncomingMessage, res: OutgoingMessage): void {
    this.activeRequestCount++;
    activeRequests.inc(1);

    const currentCount = this.mapConnections.get(req.socket) || 0;
    this.mapConnections.set(req.socket, currentCount + 1);

    if (this.terminating && !res.headersSent) {
      res.setHeader("connection", "close");
      this.sentConnectionClose.set(req.socket, true);
    }

    res.on("finish", () => this.endRequest(req.socket));
  }

  private endRequest(socket: Socket): void {
    this.activeRequestCount--;
    activeRequests.dec(1);

    const socketPendingRequests = (this.mapConnections.get(socket) || 1) - 1;
    const hasSuggestedClosingConnection =
      this.sentConnectionClose.get(socket) || false;

    this.mapConnections.set(socket, socketPendingRequests);
    if (
      this.terminating &&
      socketPendingRequests === 0 &&
      hasSuggestedClosingConnection
    ) {
      socket.end();
    }
  }

  async start(): Promise<boolean> {
    if (this.server.listening) {
      logger.warn(SERVER_CONTEXT, "start", "Already started");
      return false;
    } else {
      logger.info(SERVER_CONTEXT, "start", "starting");
      return new Promise((res, rej) => {
        const errListener = (err: any) => {
          logger.error(SERVER_CONTEXT, "start", err);
          rej(false);
        };

        this.server.once("error", errListener);

        this.server.listen(
          IS_TEST_ENV ? 0 : PORT,
          IS_TEST_ENV ? undefined : HOST,
          1000,
          () => {
            this.terminating = false;
            this.mapConnections.clear();

            this.activeConnections = 0;
            this.activeRequestCount = 0;

            this.server.removeListener("error", errListener);

            const serverAddress = this.server.address()!;
            const formattedAddress =
              typeof serverAddress === "string"
                ? serverAddress
                : `${serverAddress.address}:${serverAddress.port}`;

            this.serverAddress = formattedAddress;

            logger.info(
              SERVER_CONTEXT,
              "start",
              `Server listening on ${formattedAddress}`
            );

            res(true);
          }
        );
      });
    }
  }

  getActiveConnectionsCount(): number {
    return this.activeConnections;
  }

  getActiveRequestsCount(): number {
    return this.activeRequestCount;
  }

  getServerAddress(): string {
    return this.serverAddress;
  }

  async stop(): Promise<void> {
    if (!this.server.listening) {
      logger.warn(SERVER_CONTEXT, "stop", "Already stopped");
    } else {
      logger.info(SERVER_CONTEXT, "stop", "stopping");
      this.terminating = true;

      return new Promise((res) => {
        this.server.close((err) => {
          if (err) {
            logger.error(SERVER_CONTEXT, "stop", err);
          } else {
            logger.info(SERVER_CONTEXT, "stop", "stopped");
            res();
          }

          this.endAllConnections(false);
        });
      });
    }
  }

  forceStop(): void {
    logger.info(SERVER_CONTEXT, "stop", "force stopping");
    this.endAllConnections(true);
    if (!this.terminating) {
    }
  }

  get serverInstance(): http.Server {
    return this.server;
  }
}

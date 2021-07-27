import logger, { init as initLogger } from "./logger";
import { server } from "./server";
import { SERVER_CONTEXT } from "./utils/server";
import { init as initDB, close as closeDB } from "./db";
import { init as initQueue, closeQueues } from "./workers/producers";
import { exit, setupBaseMetricsCollection } from "./utils/setup";
import { reProcess } from "./utils/re-process";
import { GRACEFUL_SHUTDOWN_TIMEOUT, IS_TEST_ENV } from "./config";

process.on("uncaughtException", (err) => {
  logger.error(SERVER_CONTEXT, "uncaughtException", err);
  stopProcess(true);
});

process.on("unhandledRejection", (err) => {
  logger.error(SERVER_CONTEXT, "unhandledRejection", err);
  stopProcess(true);
});

process.on("SIGINT", () => {
  logger.info(SERVER_CONTEXT, "SIGINT");
  stopProcess(false);
});

process.on("SIGTERM", () => {
  logger.info(SERVER_CONTEXT, "SIGTERM");
  stopProcess(false);
});

export async function setupProcess(): Promise<void> {
  try {
    await initLogger();
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error(
      `[${SERVER_CONTEXT} ${new Date().toISOString()}]`,
      "Failed to setup logger"
    );
  }

  logger.info(SERVER_CONTEXT, "setup", "started");
  const [dbSetup, queueSeup] = await Promise.all([initDB(), initQueue()]);

  if (dbSetup && queueSeup) {
    const serverStarted = await server.start();

    if (serverStarted) {
      logger.info(SERVER_CONTEXT, "setup", "Server started");
      setupBaseMetricsCollection();
      reProcess();
    } else {
      logger.error(SERVER_CONTEXT, "setup", "Server start failed");

      await Promise.all([closeDB(), closeQueues()]);
      exit();
    }
  } else {
    logger.error(SERVER_CONTEXT, "setup", "Server setup failed");
    if (dbSetup) {
      await closeDB();
    }
    if (queueSeup) {
      await closeQueues();
    }
    exit();
  }
}

if (!IS_TEST_ENV) {
  setupProcess();
}

let stopCalled = false;

export async function stopProcess(err: boolean): Promise<void> {
  if (stopCalled) {
    return;
  }

  stopCalled = true;

  const timer = setTimeout(async () => {
    logger.info(SERVER_CONTEXT, "graceful shutdown timeout. exiting process");
    process.exit(1);
  }, GRACEFUL_SHUTDOWN_TIMEOUT);

  timer.unref();

  await server.stop();

  await Promise.all([closeDB(), closeQueues()]);
  logger.info(SERVER_CONTEXT, "graceful shutdown. exiting process");
  process.exitCode = err ? 1 : 0;
}

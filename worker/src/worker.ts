import { spawn } from "child_process";
import { Transform } from "stream";
import { inspect } from "util";

import { createStream as createRotatingFileStream } from "rotating-file-stream";
import { v4 as uuid } from "uuid";
import { TraceId } from "zipkin";

import logger from "./logger";
import { Runner } from "./types";
import {
  newChildTraceId,
  newRootTraceId,
  recordLocalOperationStart,
  recordLocalOperationStop,
  recordTag,
} from "./tracer";
import { nowTimeMicroS } from "./time";

export const WORKER_CONTEXT = "WORKER";

const transformForWrite = (obj: any) => {
  return inspect(obj, {
    colors: false,
    depth: null,
    maxStringLength: null,
    maxArrayLength: null,
    showHidden: false,
    breakLength: Infinity,
  });
};

class ErrorTransform extends Transform {
  _transform(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: (err?: any) => void
  ) {
    void encoding;

    const data = `[ERROR - ${new Date().toISOString()}] ` + chunk.toString();
    this.push(data);
    callback();
  }
}

class LogTransform extends Transform {
  _transform(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: (err?: any) => void
  ) {
    void encoding;

    const data = `[LOG - ${new Date().toISOString()}] ` + chunk.toString();
    this.push(data);
    callback();
  }
}

function jobHandler(
  jobName: string,
  cmd: string,
  args: string[] = [],
  cwd: string = process.cwd()
): Runner {
  return (job) => {
    return new Promise((res, rej) => {
      let childTraceId: TraceId | undefined = undefined;

      if (job.data?.response?.traceId) {
        const rootId = newRootTraceId(job.data.response.traceId);
        childTraceId = newChildTraceId(rootId);
        recordTag(childTraceId, "job", jobName);
        recordTag(childTraceId, "queueTime", job.data.queueTime);
        recordLocalOperationStart(
          childTraceId,
          `Process ${jobName}`,
          nowTimeMicroS()
        );
      }

      const runId = uuid();

      const outStream = createRotatingFileStream(".log", {
        encoding: "utf8",
        size: "5M",
        path: `worker-logs/${jobName}/${job.id}/${runId}/`,
      });

      outStream.write(`Starting process with id: ${runId}\n\n`);

      const childProcess = spawn(cmd, args, {
        cwd: cwd,
        stdio: "pipe",
        env: {},
        windowsHide: true,
      });

      let processRunning = true;

      const logTransform = new LogTransform();
      const errorTransform = new ErrorTransform();

      childProcess.stdout.pipe(logTransform).pipe(outStream, {
        end: false,
      });
      childProcess.stderr.pipe(errorTransform).pipe(outStream, {
        end: false,
      });

      const errorListener = (err: any) => {
        outStream.write(`Error in the process: ${transformForWrite(err)}\n\n`);
        logger.warn(WORKER_CONTEXT + ":" + jobName + ":" + runId, err);
        processRunning = false;
        tryClose();
      };

      const exitListener = (code: number, signal: string) => {
        processRunning = false;
        if (code === 0) {
          logger.debug(
            WORKER_CONTEXT + ":" + jobName + ":" + runId,
            `Exited with code: ${code} signal: ${signal}`
          );
          outStream.write(`Process exited successfully\n\n`);
          tryClose(true);
        } else {
          logger.warn(
            WORKER_CONTEXT + ":" + jobName + ":" + runId,
            `Exited with code: ${code} signal: ${signal}`
          );
          outStream.write(`Exited with code: ${code} signal: ${signal}\n\n`);
          tryClose();
        }
      };

      childProcess.once("error", errorListener);
      childProcess.once("exit", exitListener);

      if (childProcess.stdin.writable) {
        childProcess.stdin.setDefaultEncoding("utf8");
        childProcess.stdin.write(JSON.stringify(job.data));
        childProcess.stdin.end();
      } else {
        logger.warn(
          WORKER_CONTEXT + ":" + jobName + ":" + runId,
          "stdin is not writable"
        );
        tryClose();
      }

      const timeout = setTimeout(() => {
        logger.error(
          WORKER_CONTEXT + ":" + jobName + ":" + runId,
          "Timeout Exceeded. Killing the process."
        );
        outStream.write("Timeout Exceeded. Killing the process\n\n.");
        tryClose();
      }, job.options.timeout || 5000);

      function tryClose(success = false) {
        if (success) {
          res();
        } else {
          rej();
        }

        if (childTraceId) {
          recordLocalOperationStop(childTraceId, nowTimeMicroS(), !success);
        }

        clearTimeout(timeout);

        childProcess.removeListener("error", errorListener);
        childProcess.removeListener("exit", exitListener);

        logTransform.end();
        errorTransform.end();
        outStream.end();

        if (!success && processRunning) {
          childProcess.kill("SIGTERM");
          childProcess.unref();
        }
      }
    });
  };
}

export default jobHandler;

import { JOB_CONFIGURATION } from "./config";
import ConsumerQueue from "./consumer";
import logger, { init as initLogger } from "./logger";
import jobHandler, { WORKER_CONTEXT } from "./worker";

async function start() {
  try {
    await initLogger();
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error(
      `[${WORKER_CONTEXT} ${new Date().toISOString()}]`,
      "Failed to setup logger"
    );
  }

  logger.info(WORKER_CONTEXT, "Worker Started");
  const data = JSON.parse(JOB_CONFIGURATION);

  const jobs = Object.keys(data);

  if (jobs.length === 0) {
    logger.info(WORKER_CONTEXT, "No jobs found. Exiting");
    process.exit(0);
  }

  for (const job of jobs) {
    const redisURL: string = data[job].redisURL;
    const cmd: string = data[job].cmd;
    const args: string[] | undefined = data[job].args;
    const cwd: string | undefined = data[job].cwd;
    const concurrency: number = data[job].concurrency;

    const queue = await ConsumerQueue.create({ name: job, redisURL: redisURL });
    const worker = jobHandler(job, cmd, args, cwd);

    queue?.process(concurrency, worker);
    logger.info(WORKER_CONTEXT, "Processing started for: ", job);
  }
}

process.on("uncaughtException", (err: any) => {
  logger.error(WORKER_CONTEXT, "uncaughtException", err);
  stop();
});

process.on("unhandledRejection", (err: any) => {
  logger.error(WORKER_CONTEXT, "unhandledRejection", err);
  stop();
});

function stop() {
  logger.info(WORKER_CONTEXT, "Exiting process..");
  process.exit(1);
}

start();

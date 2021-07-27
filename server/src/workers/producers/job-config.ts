export const PRODUCER_QUEUE_CONTEXT = "BeeQueueProducer";

import { ALLOWED_JOBS, JOB_CONFIGURATION } from "../../config";
import logger from "../../logger";

export interface JobConfig {
  name: string;
  redisURL: string;
  backoffStrategy: "immediate" | "fixed" | "exponential";
  backoffDelay: number;
  retries: number;
  timeout: number;
}

interface JobConfigs {
  [k: string]: JobConfig;
}

const defaultConfig: Partial<JobConfig> = {
  backoffStrategy: "fixed",
  backoffDelay: 1000,
  retries: 5,
  timeout: 5 * 60 * 1000,
};

export async function loadJobConfiguration(): Promise<JobConfigs | null> {
  logger.debug(PRODUCER_QUEUE_CONTEXT, "loadJobConfiguration", "started");

  logger.info(
    PRODUCER_QUEUE_CONTEXT,
    "loadJobConfiguration",
    "ALLOWED_JOBS: ",
    ALLOWED_JOBS
  );

  try {
    const data = JSON.parse(JOB_CONFIGURATION);

    logger.debug(PRODUCER_QUEUE_CONTEXT, "loadJobConfiguration", data);

    const jobsWithConfig = Object.keys(data);

    let valid = true;

    const config: JobConfigs = {};

    for (const job of ALLOWED_JOBS) {
      if (!jobsWithConfig.includes(job)) {
        valid = false;

        logger.error(
          PRODUCER_QUEUE_CONTEXT,
          "loadJobConfiguration",
          `Configuration not found for allowed job: ${job}`
        );
      } else {
        config[job] = {
          name: job,
          redisURL: data[job].redisURL as string,
          backoffStrategy:
            data[job].backoffStrategy || defaultConfig.backoffStrategy,
          backoffDelay: data[job].backoffDelay || defaultConfig.backoffDelay,
          retries: data[job].retries || defaultConfig.retries,
          timeout: data[job].timeout || defaultConfig.timeout,
        };
      }
    }

    if (!valid) {
      logger.info(PRODUCER_QUEUE_CONTEXT, "loadJobConfiguration", "failed");
      return null;
    }

    logger.info(PRODUCER_QUEUE_CONTEXT, "loadJobConfiguration", "done");

    return config;
  } catch (err: any) {
    logger.error(PRODUCER_QUEUE_CONTEXT, "loadJobConfiguration", err);

    return null;
  }
}

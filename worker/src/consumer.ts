import BeeQueue from "bee-queue";

import logger from "./logger";
import { Runner, ConsumerQueueConfig } from "./types";

const CONSUMER_QUEUE_CONTEXT = "BeeQueueCOnsumer";

const STALL_INTERVAL = 1000;

function redisRetryStrategy(options: any) {
  if (options.attempt > 200) {
    return new Error("Maximum Redis connection attempts reached");
  }
  return 100;
}

class ConsumerQueue {
  private _queue: BeeQueue;

  constructor(config: ConsumerQueueConfig) {
    this._queue = new BeeQueue(config.name, {
      isWorker: true,
      delayedDebounce: 100,
      nearTermWindow: 5000,
      stallInterval: STALL_INTERVAL,
      activateDelayedJobs: true,
      ensureScripts: true,
      removeOnSuccess: true,
      removeOnFailure: true,
      storeJobs: false,
      sendEvents: false,
      getEvents: false,
      redis: {
        url: config.redisURL,
        retry_strategy: redisRetryStrategy,
        retry_unfulfilled_commands: true,
      },
    });
  }

  process(concurrency: number, handler: Runner): void {
    this._queue.process(concurrency, handler);
  }

  name(): string {
    return this._queue.name;
  }

  async stop(): Promise<void> {
    logger.info(CONSUMER_QUEUE_CONTEXT, this.name(), "stop", "closing queue");
    try {
      await this._queue.close(1000);
      logger.info(CONSUMER_QUEUE_CONTEXT, this.name(), "stop", "closed");
    } catch (err: any) {
      logger.info(CONSUMER_QUEUE_CONTEXT, this.name(), "stop", "error");
    }
  }

  static async create(
    config: ConsumerQueueConfig
  ): Promise<ConsumerQueue | null> {
    logger.debug(CONSUMER_QUEUE_CONTEXT, config.name, "create", "starting");
    try {
      const queue = new ConsumerQueue(config);
      await queue._queue.ready();
      await queue._queue.checkStalledJobs(STALL_INTERVAL, (err: any) => {
        if (err) logger.warn(CONSUMER_QUEUE_CONTEXT, "checkStalledJobs", err);
      });
      logger.info(CONSUMER_QUEUE_CONTEXT, config.name, "create", "ready");

      return queue;
    } catch (err: any) {
      logger.error(CONSUMER_QUEUE_CONTEXT, config.name, "start", err);
      return null;
    }
  }
}

export default ConsumerQueue;

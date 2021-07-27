import BeeQueue from "bee-queue";
import { TraceId } from "zipkin";

import { JobConfig, PRODUCER_QUEUE_CONTEXT } from "./job-config";

import { RunObject } from "../../models/run";
import logger from "../../logger";
import {
  newChildTraceId,
  newRootTraceId,
  recordProducerStart,
  recordProducerStop,
} from "../../utils/tracer";
import { addJobCount, addJobTime } from "../../utils/prometheus";
import { nowTimeMicroS, nowTimeMilliS } from "../../utils/time";

function redisRetryStrategy(options: any) {
  if (options.error && options.error.code === "ECONNREFUSED") {
    return new Error("Cannot connect to Redis server");
  }
  if (options.total_retry_time > 1000 * 60 * 30) {
    return new Error("Retry time exhausted");
  }
  if (options.attempt > 300) {
    return new Error("Maximum Retry time exhausted");
  }
  return Math.min(options.attempt * 50, 5000);
}

class ProducerQueue {
  private _queue: BeeQueue;
  private _name: string;
  private _backoffStrategy: string;
  private _backoffDelay: number;
  private _retries: number;
  private _timeout: number;

  constructor(config: JobConfig) {
    this._queue = new BeeQueue(config.name, {
      ensureScripts: true,
      isWorker: false,
      redis: {
        url: config.redisURL,
        retry_unfulfilled_commands: true,
        retry_strategy: redisRetryStrategy,
      },
      sendEvents: false,
      getEvents: false,
      activateDelayedJobs: false,
      storeJobs: false,
    });

    this._name = config.name;
    this._backoffStrategy = config.backoffStrategy;
    this._backoffDelay = config.backoffDelay;
    this._retries = config.retries;
    this._timeout = config.timeout;
  }

  async addJob(job: RunObject): Promise<boolean> {
    let childTraceId: TraceId | undefined = undefined;
    if (job.response.traceId)
      childTraceId = newChildTraceId(newRootTraceId(job.response.traceId));

    const startTime = nowTimeMilliS();

    if (childTraceId) {
      recordProducerStart(
        childTraceId,
        `Add to ${this._name} Job Queue`,
        nowTimeMicroS()
      );
    }

    try {
      await this._queue
        .createJob(job)
        .setId(job.id)
        .backoff(this._backoffStrategy, this._backoffDelay)
        .retries(this._retries)
        .timeout(this._timeout)
        .save();

      const endTime = nowTimeMilliS();

      addJobCount.inc({ name: this._name, success: "true" }, 1);
      addJobTime.observe(
        { name: this._name, success: "true" },
        endTime - startTime
      );

      if (childTraceId) {
        recordProducerStop(childTraceId, nowTimeMicroS());
      }

      return true;
    } catch (err: any) {
      const endTime = nowTimeMilliS();

      addJobCount.inc({ name: this._name, success: "false" }, 1);
      addJobTime.observe(
        { name: this._name, success: "false" },
        endTime - startTime
      );

      if (childTraceId) {
        recordProducerStop(childTraceId, nowTimeMicroS(), err);
      }

      logger.warn(PRODUCER_QUEUE_CONTEXT, this._name, "addJob", err);

      return false;
    }
  }

  name(): string {
    return this._name;
  }

  async ready(): Promise<void> {
    await this._queue.ready();
  }

  async close(): Promise<void> {
    logger.info(PRODUCER_QUEUE_CONTEXT, this._name, "closing");
    try {
      await this._queue.close(100);
      logger.info(PRODUCER_QUEUE_CONTEXT, this._name, "closed");
    } catch (err: any) {
      logger.error(PRODUCER_QUEUE_CONTEXT, this._name, "close", err);
    }
  }

  async getJob(id: string): Promise<{ run: RunObject; status: string } | null> {
    try {
      const jobData = await this._queue.getJob(id);

      return {
        run: jobData.data,
        status: jobData.status,
      };
    } catch {
      return null;
    }
  }

  static async create(config: JobConfig): Promise<ProducerQueue | null> {
    logger.debug(PRODUCER_QUEUE_CONTEXT, config.name, "create", "started");
    try {
      const queue = new ProducerQueue(config);
      await queue.ready();
      logger.info(PRODUCER_QUEUE_CONTEXT, config.name, "ready");

      return queue;
    } catch (err: any) {
      logger.error(PRODUCER_QUEUE_CONTEXT, config.name, "create", err);
      return null;
    }
  }
}

export default ProducerQueue;

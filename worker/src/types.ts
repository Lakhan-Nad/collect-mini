import BeeQueue from "bee-queue";

export interface ConsumerQueueConfig {
  name: string;
  redisURL: string;
}

export type Runner = (job: BeeQueue.Job<any>) => Promise<void>;

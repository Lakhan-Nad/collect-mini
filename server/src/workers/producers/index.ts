import PQ from "./queue";
import { PRODUCER_QUEUE_CONTEXT, loadJobConfiguration } from "./job-config";

import logger from "../../logger";
import { Form } from "../../models/forms/forms";
import Response from "../../models/responses/response";
import { RunObject, makeRunObject } from "../../models/run";
import { setProcessed } from "../../db/responses";
import sleep from "../../utils/sleep";

export const queues: {
  [k: string]: PQ;
} = {};

export async function closeQueues(): Promise<void> {
  if (Object.keys(queues).length === 0) {
    return;
  }

  logger.info(PRODUCER_QUEUE_CONTEXT, "closeQueues", "started");
  const arr: Promise<void>[] = [];

  for (const pr of Object.values(queues)) {
    arr.push(pr.close());
  }

  for (const key of Object.keys(queues)) {
    delete queues[key];
  }

  await Promise.all(arr);

  logger.info(PRODUCER_QUEUE_CONTEXT, "closeQueues", "queues closed");
}

export async function init(): Promise<boolean> {
  logger.debug(PRODUCER_QUEUE_CONTEXT, "init", "started");
  const jobConfigs = await loadJobConfiguration();

  if (!jobConfigs) {
    logger.error(PRODUCER_QUEUE_CONTEXT, "init", "Configuration load failed");
    return false;
  }

  logger.info(PRODUCER_QUEUE_CONTEXT, "init", "creating queues");

  const queuePromises: Promise<[string, PQ | null]>[] = [];

  for (const [job, config] of Object.entries(jobConfigs)) {
    queuePromises.push(
      PQ.create(config).then((pq) => {
        return [job, pq];
      })
    );
  }

  const resolvedPromises = await Promise.all(Object.values(queuePromises));

  let valid = true;

  for (const [c, prq] of Object.values(resolvedPromises)) {
    const pq = prq;

    if (!pq) {
      valid = false;
    } else {
      queues[c] = pq;
    }
  }

  if (!valid) {
    logger.error(PRODUCER_QUEUE_CONTEXT, "init", "failed to create queues");
    closeQueues();
    return false;
  }

  return true;
}

export async function processRespsonse(
  form: Form,
  response: Response
): Promise<void> {
  const id = response.getId();

  let runs: { job: string; run: RunObject }[] = [];

  for (const job of form.getJobs()) {
    runs.push({
      job: job.name,
      run: makeRunObject(job, form, response),
    });
  }

  for (const run of runs) {
    if (!queues[run.job]) {
      logger.warn(
        PRODUCER_QUEUE_CONTEXT,
        "processRespsonse",
        `Response will not be processed for ${run.job}`
      );
    }
  }

  runs = runs.filter((r) => queues[r.job]);

  if (runs.length === 0) {
    return;
  }

  let value = false;
  let tries = 0;

  do {
    if (tries > 0) {
      await sleep(Math.pow(2, tries) * 500);
    }
    const promises = runs.map((r) => queues[r.job].addJob(r.run));

    const success = await Promise.all(promises);

    runs = runs.filter((r, i) => r && !success[i]);

    value = success.every((s) => s);
    tries++;
  } while (!value && tries < 5);

  if (!value) {
    logger.error(
      PRODUCER_QUEUE_CONTEXT,
      "processResponse",
      "addJob: Failed after 3 tries"
    );

    throw new Error("Unable to add jobs to the queue");
  } else {
    const markedProcessed = await setProcessed(id);

    if (!markedProcessed) {
      throw new Error("Unable to mark jobs as processed");
    }
  }
}

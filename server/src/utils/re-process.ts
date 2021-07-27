import { SERVER_CONTEXT } from "./server";

import { getUnprocessedResponses } from "../db/responses";
import { processRespsonse } from "../workers/producers";
import logger from "../logger";
import Response from "../models/responses/response";
import { getFormById } from "../db/forms";
import { Form } from "../models/forms/forms";

export async function reProcess(): Promise<void> {
  logger.info(SERVER_CONTEXT, "reProcess", "started");
  let count = 0;

  try {
    let unprocessedResponses: Response[] | null = [];
    do {
      unprocessedResponses = await getUnprocessedResponses();

      if (!unprocessedResponses) {
        throw new Error("Unable to fetch unprocessed responses");
      }

      const forms = await Promise.all(
        unprocessedResponses.map((r) => getFormById(r.getFormId()))
      );

      if (!forms.every((f): f is Form => f instanceof Form)) {
        throw new Error("Unable to fetch forms data for responses");
      }

      let failed = 0;

      await Promise.all(
        unprocessedResponses.map((r, i) =>
          processRespsonse(forms[i], r).catch((err) => {
            logger.error(SERVER_CONTEXT, "reProcess", err);
            failed++;
          })
        )
      );

      count += unprocessedResponses.length - failed;

      if (failed) {
        throw new Error("Unable to reprocess some responses");
      }
    } while (unprocessedResponses.length > 0);
  } finally {
    logger.info(
      SERVER_CONTEXT,
      "reProcess",
      "completed",
      `processed ${count} responses`
    );
  }
}

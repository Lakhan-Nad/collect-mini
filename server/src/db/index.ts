import {
  init as connectionInit,
  MONGO_CONTEXT,
  close as connectionClose,
} from "./connection";
import { init as ownerInit, clear as ownerClear } from "./owner";
import { init as responseInit, clear as responseClear } from "./responses";
import { init as formInit, clear as formClear } from "./forms";

import logger from "../logger";

export function initCollections(): Promise<boolean> {
  logger.debug(MONGO_CONTEXT, "initCollections", "started");
  return Promise.all([ownerInit(), formInit(), responseInit()]).then(
    (status) => {
      return status.every((s) => s);
    }
  );
}

export async function init(): Promise<boolean> {
  logger.debug(MONGO_CONTEXT, "init", "started");
  return new Promise((resolve) => {
    connectionInit().then((success) => {
      if (!success) {
        logger.error(MONGO_CONTEXT, "init", "connection failed");
        resolve(false);
      } else {
        initCollections().then(async (status) => {
          if (!status) {
            logger.error(MONGO_CONTEXT, "init", "initCollections failed");
            await connectionClose();
          } else {
            logger.info(MONGO_CONTEXT, "init", "completed");
          }
          resolve(status);
        });
      }
    });
  });
}

export async function close(): Promise<void> {
  await connectionClose();
}

export async function clearCollections(): Promise<boolean> {
  logger.debug(MONGO_CONTEXT, "clearCollections", "started");
  return Promise.all([ownerClear(), formClear(), responseClear()]).then(
    (status) => {
      return status.every((s) => s);
    }
  );
}

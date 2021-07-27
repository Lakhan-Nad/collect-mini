import { Db, MongoClient } from "mongodb";

import { MONGO_URL, MONGO_DB } from "../config";
import logger from "../logger";

export const MONGO_CONTEXT = "MongoDB";

let closed = true;

export const client = new MongoClient(MONGO_URL, {
  keepAlive: true,
  keepAliveInitialDelay: 30000,
  serverSelectionTimeoutMS: 10000,
  useUnifiedTopology: true,
  poolSize: 100,
});

let _db: Db;

export async function init(): Promise<boolean> {
  logger.debug(MONGO_CONTEXT, "init", "connecting");
  try {
    await client.connect();
    _db = client.db(MONGO_DB);

    logger.info(MONGO_CONTEXT, "connected");

    closed = false;

    return true;
  } catch (err: any) {
    logger.error(MONGO_CONTEXT, "connection", err);

    return false;
  }
}

export async function close(): Promise<void> {
  if (closed) {
    return;
  }
  closed = true;
  logger.info(MONGO_CONTEXT, "connection closing");
  try {
    await client.close();
    logger.info(MONGO_CONTEXT, "connection closed");
  } catch (err: any) {
    logger.error(MONGO_CONTEXT, "close", err);
  }
}

export function getDB(): Db {
  return _db;
}

import _ from "lodash";
import { Db, Collection } from "mongodb";
import { v4 as uuid } from "uuid";
import Cache from "lru-cache";

import { getDB, MONGO_CONTEXT } from "./connection";

import { MONGO_OWNER_COLLECTION } from "../config";
import logger from "../logger";
import { Owner, OwnerObject } from "../models/owner";
import {
  mongoRequestTime,
  mongoRequestCount,
  mongoCache,
} from "../utils/prometheus";

type OwnerWithoutData = Omit<OwnerObject, "id" | "creationTime">;

let _db: Db;
let OwnerCollection: Collection<
  OwnerWithoutData & { _id: string; creationTime: string }
>;

const ownerCache = new Cache<string, Owner>({
  max: 50000,
});

const OWNER_COLLECTION_CONTEXT = MONGO_CONTEXT + ":OwnerCollection";

export async function init(): Promise<boolean> {
  logger.debug(OWNER_COLLECTION_CONTEXT, "init", "started");
  try {
    _db = getDB();

    OwnerCollection = _db.collection(MONGO_OWNER_COLLECTION);

    if (_.isNil(OwnerCollection)) {
      OwnerCollection = await _db.createCollection(MONGO_OWNER_COLLECTION);
      logger.debug(OWNER_COLLECTION_CONTEXT, "createCollection");
    }

    await OwnerCollection.createIndexes([
      {
        key: {
          _id: 1,
        },
        name: "owner_id_index",
      },
      {
        key: {
          name: 1,
        },
        name: "owner_name_index",
        unique: true,
      },
    ]);

    logger.info(OWNER_COLLECTION_CONTEXT, "initialization completed");
    return true;
  } catch (err: any) {
    logger.error(OWNER_COLLECTION_CONTEXT, "init", err);

    return false;
  }
}

export async function clear(): Promise<boolean> {
  if (!OwnerCollection) {
    return false;
  } else {
    try {
      await OwnerCollection.deleteMany({});
      logger.debug(OWNER_COLLECTION_CONTEXT, "clear");
      return true;
    } catch (err: any) {
      logger.error(OWNER_COLLECTION_CONTEXT, "clear", err);
      return false;
    }
  }
}

export async function insertOwner(
  data: OwnerWithoutData
): Promise<Owner | Error | null> {
  const metric = mongoRequestTime.startTimer({ query: "insertOwner" });
  const { name } = data;

  try {
    const creationTime = new Date().toISOString();
    const insertObj = await OwnerCollection.insertOne({
      name,
      creationTime,
      _id: uuid(),
    });

    mongoRequestCount.inc({ query: "insertOwner", success: "true" }, 1);
    metric({ success: "true" });
    const owner = new Owner(name, insertObj.insertedId, creationTime);

    ownerCache.set(owner.getId(), owner);
    return owner;
  } catch (err: any) {
    const errMsg: string = err.message;
    if (errMsg.startsWith("E11000") && errMsg.includes(`: "${name}"`)) {
      mongoRequestCount.inc({ query: "insertOwner", success: "true" }, 1);
      metric({ success: "true" });

      return new Error(`Owner with name ${name} already exists`);
    } else {
      logger.warn(OWNER_COLLECTION_CONTEXT, "insertOwner", err);

      mongoRequestCount.inc({ query: "insertOwner", success: "false" }, 1);
      metric({ success: "false" });
      return null;
    }
  }
}

export async function getOwnerById(id: string): Promise<Owner | Error | null> {
  if (ownerCache.has(id)) {
    mongoCache.inc({ hit: "false", query: "owner" }, 1);
    return ownerCache.get(id)!;
  }
  mongoCache.inc({ hit: "false", query: "owner" }, 1);

  const metric = mongoRequestTime.startTimer({ query: "getOwnerById" });
  try {
    const data = await OwnerCollection.findOne({ _id: id });

    mongoRequestCount.inc({ query: "getOwnerById", success: "true" }, 1);
    metric({ success: "true" });
    if (_.isNull(data)) {
      return new Error(`Owner with id ${id} doesn't exist`);
    } else {
      const owner = new Owner(data.name, data._id, data.creationTime);
      ownerCache.set(owner.getId(), owner);
      return owner;
    }
  } catch (err) {
    logger.warn(OWNER_COLLECTION_CONTEXT, "getOwnerById", err);

    mongoRequestCount.inc({ query: "getOwnerById", success: "false" }, 1);
    metric({ success: "false" });
    return null;
  }
}

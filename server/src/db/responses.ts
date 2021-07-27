import _ from "lodash";
import { Db, Collection, Long } from "mongodb";

import { getDB, MONGO_CONTEXT } from "./connection";
import * as helpers from "./helpers";

import { MONGO_RESPONSE_COLLECTION, SHARD_ID } from "../config";
import logger from "../logger";
import { Response, ResponseObject } from "../models/responses/response";
import sleep from "../utils/sleep";
import { mongoRequestCount, mongoRequestTime } from "../utils/prometheus";

type ResponseWithoutData = Omit<ResponseObject, "id" | "creationTime">;

let _db: Db;
let ResponseCollection: Collection<
  ResponseWithoutData & { _id: Long; creationTime: string; processed: boolean }
>;

let lastEnteredSequenceNumber: number;

let recoveredLastSequenceNumber: number;

const RESPONSE_COLLECTION_CONTEXT = MONGO_CONTEXT + ":ResponseCollection";

const SequenceRange: [Long, Long] = [
  helpers.convertToLong(SHARD_ID, 0),
  helpers.convertToLong(SHARD_ID + 1, 0),
];

export async function init(): Promise<boolean> {
  logger.debug(RESPONSE_COLLECTION_CONTEXT, "init", "started");
  try {
    _db = getDB();

    ResponseCollection = _db.collection(MONGO_RESPONSE_COLLECTION);

    if (_.isNil(ResponseCollection)) {
      ResponseCollection = await _db.createCollection(
        MONGO_RESPONSE_COLLECTION
      );
      logger.debug(RESPONSE_COLLECTION_CONTEXT, "createCollection");
    }

    await ResponseCollection.createIndexes([
      {
        key: {
          _id: 1,
        },
        name: "response_id_index",
      },
      {
        key: {
          processed: 1,
          _id: 1,
        },
        name: "response_processed_index",
      },
      {
        key: {
          formId: 1,
        },
        name: "response_form_index",
      },
      {
        key: {
          owner: 1,
        },
        name: "response_owner_index",
      },
    ]);

    logger.debug(RESPONSE_COLLECTION_CONTEXT, {
      sequenceRange: {
        start: SequenceRange[0].toString(),
        end: SequenceRange[1].toString(),
      },
    });

    const recoverLastObject = await ResponseCollection.find({
      _id: { $gte: SequenceRange[0], $lt: SequenceRange[1] },
    })
      .sort({ _id: -1 })
      .limit(1)
      .toArray();

    if (recoverLastObject.length === 0) {
      recoveredLastSequenceNumber = 0;
    } else {
      recoveredLastSequenceNumber = helpers.getComponentsFromLong(
        recoverLastObject[0]._id
      )[1];
    }

    logger.info(
      RESPONSE_COLLECTION_CONTEXT,
      "recoveredLastSequenceNumber",
      recoveredLastSequenceNumber
    );

    lastEnteredSequenceNumber = recoveredLastSequenceNumber;

    logger.info(RESPONSE_COLLECTION_CONTEXT, "initialization completed");
    return true;
  } catch (err: any) {
    logger.error(RESPONSE_COLLECTION_CONTEXT, "init", err);

    return false;
  }
}

export async function clear(): Promise<boolean> {
  if (!ResponseCollection) {
    return false;
  } else {
    try {
      await ResponseCollection.deleteMany({});
      logger.debug(RESPONSE_COLLECTION_CONTEXT, "clear");
      return true;
    } catch (err: any) {
      logger.error(RESPONSE_COLLECTION_CONTEXT, "clear", err);
      return false;
    }
  }
}

export async function insertResponse(
  data: ResponseWithoutData
): Promise<Response | null> {
  const { formId, owner, answers } = data;

  const metric = mongoRequestTime.startTimer({ query: "insertResponse" });
  try {
    const creationTime = new Date().toISOString();
    const insertObj = await ResponseCollection.insertOne({
      formId,
      owner,
      answers,
      processed: false,
      creationTime,
      _id: helpers.convertToLong(SHARD_ID, ++lastEnteredSequenceNumber),
    });

    metric({ success: "true" });
    mongoRequestCount.inc({ query: "insertResponse", success: "true" }, 1);
    return Response.fromObject({
      ...data,
      creationTime,
      id: insertObj.insertedId.toString(),
    });
  } catch (err: any) {
    logger.warn(RESPONSE_COLLECTION_CONTEXT, "insertResponse", err);

    metric({ success: "false" });
    mongoRequestCount.inc({ query: "insertResponse", success: "false" }, 1);
    return null;
  }
}

export async function getResponsesByOwner(
  owner: string
): Promise<Response[] | null> {
  const metric = mongoRequestTime.startTimer({ query: "getResponsesByOwner" });
  try {
    const data = await ResponseCollection.find({ owner }).toArray();

    metric({ success: "true" });
    mongoRequestCount.inc({ query: "getResponsesByOwner", success: "true" }, 1);
    return data.map((d) => Response.fromObject({ ...d, id: d._id.toString() }));
  } catch (err) {
    logger.warn(RESPONSE_COLLECTION_CONTEXT, "getResponsesByOwner", err);

    metric({ success: "false" });
    mongoRequestCount.inc(
      { query: "getResponsesByOwner", success: "false" },
      1
    );
    return null;
  }
}

export async function getResponsesByForm(
  id: string
): Promise<Response[] | null> {
  const metric = mongoRequestTime.startTimer({ query: "getResponsesByForm" });
  try {
    const data = await ResponseCollection.find({ formId: id }).toArray();

    metric({ success: "true" });
    mongoRequestCount.inc({ query: "getResponsesByForm", success: "true" }, 1);
    return data.map((d) => Response.fromObject({ ...d, id: d._id.toString() }));
  } catch (err) {
    logger.warn(RESPONSE_COLLECTION_CONTEXT, "getResponsesByForm", err);

    metric({ success: "false" });
    mongoRequestCount.inc({ query: "getResponsesByForm", success: "false" }, 1);
    return null;
  }
}

export async function getResponseById(
  id: string
): Promise<Response | Error | null> {
  const metric = mongoRequestTime.startTimer({ query: "getResponseById" });
  try {
    const data = await ResponseCollection.findOne({ _id: Long.fromString(id) });

    metric({ success: "true" });
    mongoRequestCount.inc({ query: "getResponseById", success: "true" }, 1);
    if (_.isNull(data)) {
      return new Error(`Response with id ${id} doesn't exist`);
    } else {
      return Response.fromObject({ ...data, id: data._id.toString() });
    }
  } catch (err) {
    logger.warn(RESPONSE_COLLECTION_CONTEXT, "getResponseById", err);

    metric({ success: "false" });
    mongoRequestCount.inc({ query: "getResponseById", success: "false" }, 1);
    return null;
  }
}

export async function getUnprocessedResponses(): Promise<Response[] | null> {
  const metric = mongoRequestTime.startTimer({
    query: "getUnprocessedResponses",
  });
  try {
    const data = await ResponseCollection.find({
      processed: false,
      _id: {
        $gte: SequenceRange[0],
        $lte: helpers.convertToLong(SHARD_ID, recoveredLastSequenceNumber),
      },
    })
      .limit(10)
      .toArray();

    metric({ success: "true" });
    mongoRequestCount.inc(
      { query: "getUnprocessedResponses", success: "true" },
      1
    );
    return data.map((r) => Response.fromObject({ ...r, id: r._id.toString() }));
  } catch (err: any) {
    logger.error(RESPONSE_COLLECTION_CONTEXT, "getUnprocessedResponses", err);

    metric({ success: "false" });
    mongoRequestCount.inc(
      { query: "getUnprocessedResponses", success: "false" },
      1
    );
    return null;
  }
}

export async function setProcessed(id: string): Promise<boolean> {
  let tries = 0;
  let value = false;

  do {
    if (tries > 0) {
      await sleep(Math.pow(2, tries) * 500);
    }
    const metric = mongoRequestTime.startTimer({ query: "setProcessed" });
    try {
      const data = await ResponseCollection.updateOne(
        { _id: Long.fromString(id) },
        { $set: { processed: true } }
      );

      metric({ success: "true" });
      mongoRequestCount.inc({ query: "setProcessed", success: "true" }, 1);
      if (data.modifiedCount === 1) {
        value = true;
      }
    } catch (err: any) {
      logger.warn(RESPONSE_COLLECTION_CONTEXT, "setProcessed", err);

      metric({ success: "false" });
      mongoRequestCount.inc({ query: "setProcessed", success: "false" }, 1);
    }

    tries++;
  } while (!value && tries < 5);

  if (!value) {
    logger.error(
      RESPONSE_COLLECTION_CONTEXT,
      "setProcessed",
      "Failed after 3 tries"
    );
  }
  return value;
}

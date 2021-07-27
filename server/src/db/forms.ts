import _ from "lodash";
import { Db, Collection } from "mongodb";
import { v4 as uuid } from "uuid";
import Cache from "lru-cache";

import { getDB, MONGO_CONTEXT } from "./connection";

import { MONGO_FORM_COLLECTION } from "../config";
import logger from "../logger";
import { Form, FormObject } from "../models/forms/forms";
import {
  mongoRequestTime,
  mongoRequestCount,
  mongoCache,
} from "../utils/prometheus";

type FormWithoutData = Omit<FormObject, "id" | "creationTime">;

let _db: Db;
let FormCollection: Collection<
  FormWithoutData & { _id: string; creationTime: string }
>;

const formCache = new Cache<string, Form>({
  max: 25000,
  length: (f) => f.getQuestions().length,
});

const FORM_COLLECTION_CONTEXT = MONGO_CONTEXT + ":FormCollection";

export async function init(): Promise<boolean> {
  logger.debug(FORM_COLLECTION_CONTEXT, "init", "started");
  try {
    _db = getDB();

    FormCollection = _db.collection(MONGO_FORM_COLLECTION);

    if (_.isNil(FormCollection)) {
      FormCollection = await _db.createCollection(MONGO_FORM_COLLECTION);
      logger.debug(FORM_COLLECTION_CONTEXT, "createCollection");
    }

    await FormCollection.createIndexes([
      {
        key: {
          _id: 1,
        },
        name: "form_id_index",
      },
      {
        key: {
          owner: 1,
        },
        name: "form_owner_index",
      },
    ]);

    logger.info(FORM_COLLECTION_CONTEXT, "initialization completed");
    return true;
  } catch (err: any) {
    logger.error(FORM_COLLECTION_CONTEXT, "init", err);

    return false;
  }
}

export async function clear(): Promise<boolean> {
  if (!FormCollection) {
    return false;
  } else {
    try {
      await FormCollection.deleteMany({});
      logger.debug(FORM_COLLECTION_CONTEXT, "clear");
      return true;
    } catch (err: any) {
      logger.error(FORM_COLLECTION_CONTEXT, "clear", err);
      return false;
    }
  }
}

export async function insertForm(data: FormWithoutData): Promise<Form | null> {
  const metric = mongoRequestTime.startTimer({ query: "insertForm" });
  const { name, description, questions, owner, jobs } = data;

  try {
    const creationTime = new Date().toISOString();
    const insertObj = await FormCollection.insertOne({
      name,
      description,
      questions,
      owner,
      jobs,
      creationTime,
      _id: uuid(),
    });

    mongoRequestCount.inc({ query: "insertForm", success: "true" }, 1);
    metric({ success: "true" });
    const form = Form.fromObject({
      ...data,
      creationTime,
      id: insertObj.insertedId,
    });

    formCache.set(form.getId(), form);
    return form;
  } catch (err: any) {
    logger.warn(FORM_COLLECTION_CONTEXT, "insertForm", err);

    mongoRequestCount.inc({ query: "insertForm", success: "false" }, 1);
    metric({ success: "false" });
    return null;
  }
}

export async function getFormByOwner(id: string): Promise<Form[] | null> {
  const metric = mongoRequestTime.startTimer({ query: "getFormByOwner" });
  try {
    const data = await FormCollection.find({ owner: id }).toArray();

    mongoRequestCount.inc({ query: "getFormByOwner", success: "true" }, 1);
    metric({ success: "true" });
    return data.map((d) => Form.fromObject({ ...d, id: d._id }));
  } catch (err) {
    logger.warn(FORM_COLLECTION_CONTEXT, "getFormByOwner", err);

    mongoRequestCount.inc({ query: "getFormByOwner", success: "false" }, 1);
    metric({ success: "false" });
    return null;
  }
}

export async function getFormById(id: string): Promise<Form | Error | null> {
  if (formCache.has(id)) {
    mongoCache.inc({ hit: "true", query: "form" }, 1);
    return formCache.get(id)!;
  }
  mongoCache.inc({ hit: "false", query: "form" }, 1);

  const metric = mongoRequestTime.startTimer({ query: "getFormById" });
  try {
    const data = await FormCollection.findOne({ _id: id });

    mongoRequestCount.inc({ query: "getFormById", success: "true" }, 1);
    metric({ success: "true" });
    if (_.isNull(data)) {
      return new Error(`Form with id ${id} doesn't exist`);
    } else {
      const form = Form.fromObject({ ...data, id: data._id });
      formCache.set(id, form);
      return form;
    }
  } catch (err) {
    logger.warn(FORM_COLLECTION_CONTEXT, "getFormById", err);

    mongoRequestCount.inc({ query: "getFormById", success: "false" }, 1);
    metric({ success: "false" });
    return null;
  }
}

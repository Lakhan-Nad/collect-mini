import { close, init } from "../";
import { getDB, client } from "../connection";
import {
  MONGO_FORM_COLLECTION,
  MONGO_OWNER_COLLECTION,
  MONGO_RESPONSE_COLLECTION,
} from "../../config";

beforeAll(async () => {
  await init();
});

afterAll(async () => {
  await close();
});

test("MongoDB is ready", async () => {
  expect(client.isConnected()).toBe(true);

  const db = getDB();

  expect(db).not.toBeUndefined();
});

test("Collections are made", async () => {
  const db = getDB();

  const collections = await db.collections();

  const collectionNames = collections.map((c) => c.collectionName);

  expect(collectionNames.includes(MONGO_FORM_COLLECTION));
  expect(collectionNames.includes(MONGO_OWNER_COLLECTION));
  expect(collectionNames.includes(MONGO_RESPONSE_COLLECTION));
});

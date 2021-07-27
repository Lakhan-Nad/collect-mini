import { Form } from "../../models/forms/forms";
import Response from "../../models/responses/response";
import { makeRunObject } from "../../models/run";
import { init, closeQueues, queues } from "../producers/index";

beforeAll(async () => {
  await init();
});

afterAll(async () => {
  await closeQueues();
});

test("Queues are initialized", () => {
  expect(queues.mail.name()).toBe("mail");

  expect(queues.test.name()).toBe("test");
});

test("Job is added", async () => {
  const mailJob = makeRunObject(
    { name: "mail", params: {} },
    new Form("1", "A", "test", new Date().toString()),
    new Response("1", "1", "A", [], new Date().toISOString())
  );
  await queues.mail.addJob(mailJob);

  const testJob = makeRunObject(
    { name: "test", params: {} },
    new Form("1", "A", "test", new Date().toString()),
    new Response("1", "1", "A", [], new Date().toISOString())
  );
  await queues.test.addJob(testJob);

  const getMailJob = await queues.mail.getJob("1:mail");
  const getTestJob = await queues.test.getJob("1:test");

  expect(getMailJob?.status).toBe("created");
  expect(getTestJob?.status).toBe("created");

  expect(getTestJob?.run).toStrictEqual(testJob);
  expect(getMailJob?.run).toStrictEqual(mailJob);
});

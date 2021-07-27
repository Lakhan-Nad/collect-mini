import supertest from "supertest";

jest.setTimeout(15000);

import { server } from "../server";
import { setupProcess, stopProcess } from "../index";

const request = supertest(server.serverInstance);

beforeAll(async () => {
  await setupProcess();
});

afterAll(async () => {
  await stopProcess(false);
});

describe("Creation of Forms", () => {
  const ownerName = "abrandformowner";
  let ownerId: string;
  let formId: string;
  let responseId: string;

  test("adding owner with non existing name", async () => {
    const response = await request.post("/owners").send({
      name: ownerName,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("id");
    ownerId = response.body.data.id;
  });

  test("auth must work", async () => {
    const response = await request.get(`/owners/${ownerId}/forms`);
    expect(response.statusCode).toBe(401);
  });

  test("forms of a new owner must be 0", async () => {
    const response = await request
      .get(`/owners/${ownerId}/forms`)
      .set("authorization", `Bearer ${ownerId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveLength(0);
  });

  test("errors on ill-formed json", async () => {
    const response = await request
      .post(`/forms`)
      .set("authorization", `Bearer ${ownerId}`)
      .send("{[}]");
    expect(response.statusCode).toBe(400);
  });

  test("adding new form of a owner", async () => {
    const response = await request
      .post("/forms")
      .set("authorization", `Bearer ${ownerId}`)
      .send({
        name: "a form name can be anything",
        description: "description of form again can be anything",
        owner: ownerId,
        jobs: [{ name: "mail" }],
        questions: [
          {
            type: "text",
            text: "What is your name",
            description: "Name of the candidate",
            constraints: {
              required: true,
            },
          },
          {
            type: "choice",
            text: "Enter your gender",
            description: "Gender of Candidate",
            constraints: {
              maxSelection: 1,
              choices: ["male", "female", "other"],
            },
          },
          {
            type: "number",
            text: "Enter your age",
            description: "age of candidate",
            constraints: {
              maximum: 90,
              minimum: 1,
              isInteger: true,
            },
          },
          {
            type: "number",
            text: "Enter your salary",
            description: "salary of candidate",
            constraints: {
              minimum: 0,
              required: false,
            },
          },
        ],
      });
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("questions");
    expect(response.body.data.questions).toHaveLength(4);
    expect(response.body.data.id).toMatch(
      new RegExp(
        /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
      )
    );
    formId = response.body.data.id;
  });

  test("forms created must return", async () => {
    const response = await request
      .get(`/forms/${formId}`)
      .set("authorization", `Bearer ${ownerId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data).toHaveProperty("questions");
    expect(response.body.data.questions).toHaveLength(4);
  });

  test("newly created forms must have zero responses", async () => {
    const response = await request
      .get(`/forms/${formId}/responses`)
      .set("authorization", `Bearer ${ownerId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveLength(0);
  });

  test("missing responses", async () => {
    const response = await request
      .post(`/forms/${formId}/responses`)
      .set("authorization", `Bearer ${ownerId}`)
      .send({
        responses: ["Some Name", "male"],
      });
    expect(response.statusCode).toBe(400);
  });

  test("invalid responses", async () => {
    const response = await request
      .post(`/forms/${formId}/responses`)
      .set("authorization", `Bearer ${ownerId}`)
      .send({
        responses: ["Some Name", "any", 30, 212912],
      });
    expect(response.statusCode).toBe(400);
  });

  test("allow non required responses to be null", async () => {
    const response = await request
      .post(`/forms/${formId}/responses`)
      .set("authorization", `Bearer ${ownerId}`)
      .send({
        responses: ["Some Name", ["male"], 30, null],
      });
    expect(response.statusCode).toBe(201);
    responseId = response.body.data.id;
  });

  test("check for only integer field", async () => {
    const response = await request
      .post(`/forms/${formId}/responses`)
      .set("authorization", `Bearer ${ownerId}`)
      .send({
        responses: ["Some Name", "any", 30.979, null],
      });
    expect(response.statusCode).toBe(400);
  });

  test("get response back", async () => {
    const response = await request
      .get(`/responses/${responseId}`)
      .set("authorization", `Bearer ${ownerId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.formId).toBe(formId);
  });
});

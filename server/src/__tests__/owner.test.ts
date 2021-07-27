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

describe("Creation of an Owner", () => {
  const errorName = "a-new-owner-name";
  const commonName = "newowner";
  let ownerId: string;

  test("adding owner with invalid name", async () => {
    const response = await request.post("/owners").send({
      name: errorName,
    });
    expect(response.statusCode).toBe(400);
  });

  test("adding owner with non existing name", async () => {
    const response = await request.post("/owners").send({
      name: commonName,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data.id).toMatch(
      /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
    );
    ownerId = response.body.data.id;
  });

  test("getting new owner's forms without auth", async () => {
    const responseFirst = await request.get(`/owners/${ownerId}/forms`).send();
    expect(responseFirst.status).toBe(401);
    expect(responseFirst.body).toHaveProperty("error");
  });

  test("getting new owner's forms with auth", async () => {
    const responseFirst = await request
      .get(`/owners/${ownerId}/forms`)
      .set("authorization", `Bearer ${ownerId}`)
      .send();
    expect(responseFirst.status).toBe(200);
    expect(responseFirst.body).toHaveProperty("data");
    expect(responseFirst.body.data.length).toBe(0);
  });

  test("getting owner data", async () => {
    const responseFirst = await request
      .get(`/owners/${ownerId}`)
      .set("authorization", `Bearer ${ownerId}`);
    expect(responseFirst.body).toHaveProperty("data");
    expect(responseFirst.body.data).toHaveProperty("id");
    expect(responseFirst.body.data.id).toBe(ownerId);
  });

  test("adding owner with exisiting name", async () => {
    const response = await request.post("/owners").send({
      name: commonName,
    });
    expect(response.statusCode).toBe(400);
  });
});

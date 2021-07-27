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

test("jobs route", async () => {
  const response = await request.get("/jobs");
  expect(response.statusCode).toBe(200);
  expect(response.body).toHaveProperty("jobs");
  expect(response.body.jobs).toContain("mail");
  expect(response.body.jobs).toContain("test");
});

test("invalid route", async () => {
  const response = await request.get("/invalid");
  expect(response.statusCode).toBe(404);
});

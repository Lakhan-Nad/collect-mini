import { cpuUsage, memoryUsage } from "../system-usage";

test("memory usage", () => {
  const memUsage = memoryUsage();

  expect(memUsage).toHaveProperty("process");
  expect(memUsage).toHaveProperty("system");

  expect(memUsage.process).toBeLessThanOrEqual(memUsage.system);
});

test("cpu usage", async () => {
  const cpuUse = await cpuUsage();

  expect(cpuUse).toHaveProperty("process");
  expect(cpuUse).toHaveProperty("system");
});

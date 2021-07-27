import os from "os";

import { cpuUsage as cuMetric, memoryUsage as muMetric } from "./prometheus";

function cpuAverage() {
  let totalIdle = 0;
  let totalTick = 0;

  const cpus = os.cpus();

  for (let i = 0, len = cpus.length; i < len; i++) {
    const cpu = cpus[i];

    for (const time of Object.values(cpu.times)) {
      totalTick += time;
    }

    totalIdle += cpu.times.idle;
  }

  return {
    idle: totalIdle,
    total: totalTick,
  };
}

export async function cpuUsage(): Promise<{ system: number; process: number }> {
  const startMeasure = cpuAverage();

  const processStartUsage = process.cpuUsage();

  return new Promise((res) => {
    const timer = setTimeout(function () {
      const endMeasure = cpuAverage();

      const processEndUsage = process.cpuUsage(processStartUsage);
      const processDifference =
        (processEndUsage.user + processEndUsage.system) / 1000;

      const idleDifference = endMeasure.idle - startMeasure.idle;
      const totalDifference = endMeasure.total - startMeasure.total;

      const totalPercentageCPU = 100 * (1 - idleDifference / totalDifference);
      const processPercentageCPU = (100 * processDifference) / totalDifference;

      cuMetric.set({ type: "system" }, totalPercentageCPU);
      cuMetric.set({ type: "process" }, processPercentageCPU);

      res({ system: totalPercentageCPU, process: processPercentageCPU });
    }, 100);

    timer.unref();
  });
}

export function memoryUsage(): { system: number; process: number } {
  const processRss = process.memoryUsage().rss;
  const systemMemory = os.totalmem() - os.freemem();

  const systemMemMB = systemMemory / 1024 / 1024;
  const processMemMB = processRss / 1024 / 1024;

  muMetric.set({ type: "system" }, systemMemMB);
  muMetric.set({ type: "process" }, processMemMB);

  return {
    system: systemMemMB,
    process: processMemMB,
  };
}

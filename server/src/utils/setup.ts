import { cpuUsage, memoryUsage } from "./system-usage";
import { SERVER_CONTEXT } from "./server";

import { server } from "../server";
import logger from "../logger";

export function setupBaseMetricsCollection(): void {
  const timer = setInterval(async function () {
    const cpuUsageStats = await cpuUsage();
    const memoryUsageStats = memoryUsage();

    const activeConnections = server.getActiveConnectionsCount();
    const activeRequests = server.getActiveRequestsCount();

    logger.debug(
      SERVER_CONTEXT,
      "CPU",
      "System",
      `${cpuUsageStats.system}%`,
      "process",
      `${cpuUsageStats.process}%`
    );

    logger.debug(
      SERVER_CONTEXT,
      "RAM",
      "System",
      `${memoryUsageStats.system} MiB`,
      "process",
      `${memoryUsageStats.process} MiB`
    );

    logger.debug(SERVER_CONTEXT, "Active Requests", activeRequests);

    logger.debug(SERVER_CONTEXT, "Active Connections", activeConnections);
  }, 10000);

  timer.unref();
}

export function exit(): void {
  logger.info(SERVER_CONTEXT, "exiting");
  process.exit(1);
}

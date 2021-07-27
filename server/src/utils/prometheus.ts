import { Histogram, Gauge, Counter, exponentialBuckets } from "prom-client";

export { register } from "prom-client";

export const cpuUsage = new Gauge({
  name: "cpu_usage_percentage",
  help: "Percentage CPU usage",
  labelNames: ["type"] as const,
});

export const memoryUsage = new Gauge({
  name: "memory_usage_mb",
  help: "Memory usage in MB",
  labelNames: ["type"] as const,
});

export const activeRequests = new Gauge({
  name: "active_requests_count",
  help: "Number of active requests",
  labelNames: [] as const,
});

export const activeConnections = new Gauge({
  name: "active_connections_count",
  help: "Number of active connections",
  labelNames: [] as const,
});

export const requestCount = new Counter({
  name: "total_request_count",
  help: "Number of total HTTP requests",
  labelNames: ["method", "path"] as const,
});

export const requestSize = new Histogram({
  name: "request_size_bytes",
  help: "Size of HTTP requests",
  labelNames: ["method", "path"] as const,
  buckets: exponentialBuckets(1, 10, 7),
});

export const responseCount = new Counter({
  name: "total_response_count",
  help: "Number of total HTTP responses",
  labelNames: ["method", "path", "status"] as const,
});

export const responseSize = new Histogram({
  name: "response_size_bytes",
  help: "Size of HTTP responses",
  labelNames: ["method", "path", "status"] as const,
  buckets: exponentialBuckets(10, 10, 7),
});

export const responseTime = new Histogram({
  name: "response_time_ms",
  help: "Response time for HTTP responses",
  labelNames: ["method", "path", "status"] as const,
  buckets: [
    5, 10, 50, 100, 500, 1000, 2000, 3000, 5000, 10000, 20000, 30000, 40000,
    50000,
  ],
});

export const mongoRequestCount = new Counter({
  name: "mongo_request_count",
  help: "Number of Mongo DB queries",
  labelNames: ["query", "success"] as const,
});

export const mongoRequestTime = new Histogram({
  name: "mongo_request_time_s",
  help: "Request time for Mongo DB queries",
  labelNames: ["query", "success"] as const,
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 3, 4, 5, 10, 20, 30, 40, 50],
});

export const mongoCache = new Counter({
  name: "mongo_cache_count",
  help: "Mongo DB cache",
  labelNames: ["query", "hit"] as const,
});

export const addJobCount = new Counter({
  name: "queue_add_job_count",
  help: "Number of jobs added to the queue",
  labelNames: ["name", "success"] as const,
});

export const addJobTime = new Histogram({
  name: "queue_add_job_time_ms",
  help: "Time taken to add jobs to the queue",
  labelNames: ["name", "success"] as const,
  buckets: [
    1, 5, 10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000, 2000, 3000, 4000,
    5000, 10000, 20000, 30000, 40000, 50000,
  ],
});

import dotenv from "dotenv";

dotenv.config();

// Log Level: error, warning, info, debug
export const LOG_LEVEL = process.env.LOG_LEVEL || "warn";

// Shard ID
export const SHARD_ID = Number.parseInt(process.env.SHARD_ID || "0", 10);

// MongoDB URL
export const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017";

// MongoDB Database
export const MONGO_DB = process.env.MONGO_DB || "default";

// HTTP
export const HOST = process.env.HOST || "0.0.0.0";
export const PORT = Number.parseInt(process.env.PORT || "3000");

// MongoDB Collections Name
export const MONGO_OWNER_COLLECTION =
  process.env.MONGO_OWNER_COLLECTION || "owners";

export const MONGO_FORM_COLLECTION =
  process.env.MONGO_FORM_COLLECTION || "forms";

export const MONGO_RESPONSE_COLLECTION =
  process.env.MONGO_RESPONSE_COLLECTION || "responses";

// Allowed Jobs for Forms
export const ALLOWED_JOBS = (process.env.ALLOWED_JOBS || "")
  .split(",")
  .map((s) => s.trim())
  .filter((s) => s);

// Configuration for Jobs
export const JOB_CONFIGURATION = process.env.JOB_CONFIGURATION || "{}";

// Timeout before server with force shutdown
export const GRACEFUL_SHUTDOWN_TIMEOUT = Number.parseInt(
  process.env.GRACEFUL_SHUTDOWN_TIMEOUT || "10000"
);

// Is test environment
export const IS_TEST_ENV =
  process.env.NODE_ENV === "TEST" || process.env.NODE_ENV === "test";

// Is production environment
export const IS_PROD_ENV =
  process.env.NODE_ENV === "PROD" ||
  process.env.NODE_ENV === "PRODUCTION" ||
  process.env.NODE_ENV === "prod" ||
  process.env.NODE_ENV === "production";

// Zipkin
export const ZIPKIN_ENABLED = process.env.ZIPKIN_ENABLED === "true";
export const ZIPKIN_URL = process.env.ZIPKIN_URL;

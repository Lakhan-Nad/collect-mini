import dotenv from "dotenv";

dotenv.config();

// Log Level: error, warning, info, debug
export const LOG_LEVEL = process.env.LOG_LEVEL || "warn";

// Configuration for Jobs
export const JOB_CONFIGURATION = process.env.JOB_CONFIGURATION || "{}";

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

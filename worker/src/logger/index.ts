import { LOG_LEVEL, IS_PROD_ENV } from "../config";

export enum LogLevel {
  debug = 0,
  info,
  warn,
  error,
}

export interface Logger {
  debug: (...obj: any[]) => void;
  info: (...obj: any[]) => void;
  warn: (...obj: any[]) => void;
  error: (...obj: any[]) => void;
}

const currentLogLevel: LogLevel = (() => {
  switch (LOG_LEVEL) {
    case "error":
      return LogLevel.error;
    case "info":
      return LogLevel.info;
    case "debug":
      return LogLevel.debug;
    default:
      return LogLevel.warn;
  }
})();

let defaultLogger: Logger;

export async function init(): Promise<void> {
  defaultLogger = IS_PROD_ENV
    ? (await import("./rotate-file")).default
    : (await import("./console")).default;
}

export function error(context: string, ...obj: any[]): void {
  if (currentLogLevel <= LogLevel.error) {
    defaultLogger.error(`[${context} ${new Date().toISOString()}]`, ...obj);
  }
}

export function warn(context: string, ...obj: any[]): void {
  if (currentLogLevel <= LogLevel.warn) {
    defaultLogger.warn(`[${context} ${new Date().toISOString()}]`, ...obj);
  }
}

export function info(context: string, ...obj: any[]): void {
  if (currentLogLevel <= LogLevel.info) {
    defaultLogger.info(`[${context} ${new Date().toISOString()}]`, ...obj);
  }
}

export function debug(context: string, ...obj: any[]): void {
  if (currentLogLevel <= LogLevel.debug) {
    defaultLogger.debug(`[${context} ${new Date().toISOString()}]`, ...obj);
  }
}

export default { error, info, warn, debug };

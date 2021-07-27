/* eslint-disable no-console */

export default {
  debug: (...obj: any[]): void => {
    console.log("DEBUG", ...obj);
  },
  info: (...obj: any[]): void => {
    console.log("INFO", ...obj);
  },
  warn: (...obj: any[]): void => {
    console.error("WARN", ...obj);
  },
  error: (...obj: any[]): void => {
    console.error("ERROR", ...obj);
  },
};

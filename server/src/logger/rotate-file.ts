import { formatWithOptions } from "util";

import { createStream } from "rotating-file-stream";

const stream = createStream(".log", {
  encoding: "utf8",
  path: "logs/",
  size: "16M",
});

export default {
  debug: (...obj: any[]): void => {
    stream.write(
      formatWithOptions(
        {
          colors: false,
          depth: null,
          maxStringLength: null,
          maxArrayLength: null,
          showHidden: false,
          breakLength: Infinity,
        },
        "DEBUG",
        ...obj,
        "\n"
      )
    );
  },
  info: (...obj: any[]): void => {
    stream.write(
      formatWithOptions(
        {
          colors: false,
          depth: null,
          maxStringLength: null,
          maxArrayLength: null,
          showHidden: false,
          breakLength: Infinity,
        },
        "INFO",
        ...obj,
        "\n"
      )
    );
  },
  warn: (...obj: any[]): void => {
    stream.write(
      formatWithOptions(
        {
          colors: false,
          depth: null,
          maxStringLength: null,
          maxArrayLength: null,
          showHidden: false,
          breakLength: Infinity,
        },
        "WARN",
        ...obj,
        "\n"
      )
    );
  },
  error: (...obj: any[]): void => {
    stream.write(
      formatWithOptions(
        {
          colors: false,
          depth: null,
          maxStringLength: null,
          maxArrayLength: null,
          showHidden: false,
          breakLength: Infinity,
        },
        "ERROR",
        ...obj,
        "\n"
      )
    );
  },
};

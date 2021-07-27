import {
  ExplicitContext,
  Annotation,
  TraceId,
  Tracer,
  BatchRecorder,
  jsonEncoder,
  option,
} from "zipkin";
import { HttpLogger } from "zipkin-transport-http";

import { ZIPKIN_ENABLED, ZIPKIN_URL } from "./config";
import logger from "./logger";

const CHARS = "abcdef1234567890";

export function createRandomId(): string {
  let result = "";

  for (let i = 0; i < 16; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  return result;
}

const LOCAL_SERVICE_NAME = "worker";

export const tracer = ZIPKIN_ENABLED
  ? new Tracer({
      ctxImpl: new ExplicitContext(),
      localServiceName: LOCAL_SERVICE_NAME,
      recorder: new BatchRecorder({
        logger: ZIPKIN_URL
          ? new HttpLogger({
              httpInterval: 5000,
              jsonEncoder: jsonEncoder.JSON_V2,
              endpoint: `${ZIPKIN_URL}/api/v2/spans`,
            })
          : {
              logSpan: (span) => {
                logger.debug("TRACER", span);
              },
            },
      }),
    })
  : null;

export function newRootTraceId(id: string): TraceId {
  return new TraceId({
    debug: false,
    sampled: new option.Some(true),
    parentId: option.None,
    traceId: id,
    spanId: id,
  });
}

export function newChildTraceId(parentId: TraceId, id?: string): TraceId {
  if (!id) {
    id = createRandomId();
  }

  return new TraceId({
    debug: false,
    sampled: new option.Some(true),
    parentId: new option.Some(parentId.spanId),
    traceId: parentId.traceId,
    spanId: id,
  });
}

export function recordLocalOperationStart(
  id: TraceId,
  name: string,
  time?: number
): void {
  tracer?.scoped(() => {
    tracer!.setId(id);
    tracer!.recordServiceName(LOCAL_SERVICE_NAME);
    tracer!.recordAnnotation(new Annotation.LocalOperationStart(name), time);
  });
}

export function recordLocalOperationStop(
  id: TraceId,
  time?: number,
  err?: any
): void {
  tracer?.scoped(() => {
    tracer!.setId(id);
    if (err !== undefined) {
      tracer!.recordBinary("error", JSON.stringify(err));
    }
    tracer!.recordAnnotation(new Annotation.LocalOperationStop(), time);
  });
}

export function recordTag(
  id: TraceId,
  name: string,
  value: number | string
): void {
  tracer?.scoped(() => {
    tracer!.setId(id);
    tracer!.recordBinary(name, value);
  });
}

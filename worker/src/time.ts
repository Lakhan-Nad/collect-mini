const START_TIMESTAMP = Date.now();
const START_TICK = process.hrtime();

export function nowTimeMicroS(): number {
  const diffTime = process.hrtime(START_TICK);
  return (
    START_TIMESTAMP * 1000 +
    Math.ceil(diffTime[0] * 1000000 + diffTime[1] / 1000)
  );
}

export function nowTimeMilliS(): number {
  const diffTime = process.hrtime(START_TICK);
  return (
    START_TIMESTAMP + Math.ceil(diffTime[0] * 1000 + diffTime[1] / 1000000)
  );
}

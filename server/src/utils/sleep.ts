export default async function sleep(timeout: number): Promise<void> {
  if (timeout === 0) {
    return;
  }
  return new Promise<void>((res) => {
    setTimeout(res, timeout);
  });
}

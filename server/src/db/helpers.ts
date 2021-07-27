import { Long } from "mongodb";

const Num2Power50 = Math.pow(2, 50);
const BigInt2Power50 = BigInt(Num2Power50);
const Long2Power50 = Long.fromNumber(Num2Power50);

export function convertToLong(shard: number, sequence: number): Long {
  return Long.fromNumber(shard)
    .multiply(Long2Power50)
    .add(Long.fromNumber(sequence));
}

export function getComponents(value: bigint): [number, number] {
  return [Number(value / BigInt2Power50), Number(value % BigInt2Power50)];
}

export function getComponentsFromLong(value: Long): [number, number] {
  return getComponents(longToBigInt(value));
}

export function bigIntToLong(value: bigint): Long {
  return convertToLong(...getComponents(value));
}

export function longToBigInt(value: Long): bigint {
  return BigInt(value.toString(10));
}

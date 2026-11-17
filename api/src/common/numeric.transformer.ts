import { ValueTransformer } from 'typeorm';

export const numeric: ValueTransformer = {
  to: (v?: number | null) => v,
  from: (v?: string | null) => (v === null || v === undefined ? v : Number(v)),
};

export const round2 = (v: number) => Math.round(v * 100) / 100;

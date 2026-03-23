import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Prisma's internal Decimal class differs from the exported one.
// Patch the actual runtime class's toJSON to return numbers instead of strings.
// We do this by making a throwaway query and patching the prototype from a real Decimal instance.
let decimalPatched = false;
export async function patchDecimalSerialization() {
  if (decimalPatched) return;
  decimalPatched = true;
  try {
    // Run a lightweight query that returns a Decimal field
    const row = await prisma.$queryRawUnsafe<{ v: unknown }[]>('SELECT 1.0::decimal AS v');
    if (row?.[0]?.v && typeof row[0].v === 'object' && row[0].v !== null) {
      const proto = Object.getPrototypeOf(row[0].v);
      if (proto && typeof proto.toNumber === 'function') {
        proto.toJSON = function (this: { toNumber(): number }) {
          return this.toNumber();
        };
      }
    }
  } catch {
    // If this fails, Decimals will serialize as strings (existing behavior)
  }
}

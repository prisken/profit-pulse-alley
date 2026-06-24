import "server-only";

/** True when Prisma can open a Postgres connection (`POSTGRES_URL` is non-empty). */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.POSTGRES_URL?.trim());
}

/**
 * Authorization for scheduled cron routes.
 * Accepts either a `CRON_SECRET` request header or `Authorization: Bearer <secret>`.
 * Rejects all requests when `process.env.CRON_SECRET` is unset.
 */
export function isAuthorizedCronRequest(
  request: Request,
  env: { CRON_SECRET?: string | undefined } = process.env as {
    CRON_SECRET?: string | undefined;
  },
): boolean {
  const expected = env.CRON_SECRET?.trim();
  if (!expected) {
    return false;
  }

  const headerSecret =
    request.headers.get("cron_secret")?.trim() ||
    request.headers.get("x-cron-secret")?.trim() ||
    null;

  if (headerSecret && headerSecret === expected) {
    return true;
  }

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const bearerMatch = /^Bearer\s+(.+)$/i.exec(authorization);
  const bearer = bearerMatch?.[1]?.trim();
  return Boolean(bearer && bearer === expected);
}

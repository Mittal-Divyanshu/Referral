/**
 * Minimal structured logger.
 *
 * Server-side only. We log the important lifecycle operations (registration,
 * attribution, qualification, reward changes) as single-line JSON so they are
 * greppable. We NEVER pass passwords, hashes or session tokens in here -- call
 * sites are responsible for not doing so, and the shape below only invites
 * ids and statuses.
 */
type LogFields = Record<string, string | number | boolean | null | undefined>;

function emit(
  level: "info" | "warn" | "error",
  event: string,
  fields?: LogFields,
) {
  const line = JSON.stringify({
    t: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (event: string, fields?: LogFields) => emit("info", event, fields),
  warn: (event: string, fields?: LogFields) => emit("warn", event, fields),
  error: (event: string, fields?: LogFields) => emit("error", event, fields),
};

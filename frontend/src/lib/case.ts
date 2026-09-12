function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof File) &&
    !(value instanceof Date)
  );
}

const toCamelKey = (key: string): string => key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const toSnakeKey = (key: string): string => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** Converts a JSON API response (snake_case, DRF convention) into the
 * camelCase shape every component in this app is written against. */
export function toCamel<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) return input.map((item) => toCamel(item)) as unknown as T;
  if (isPlainObject(input)) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      out[toCamelKey(key)] = toCamel(value);
    }
    return out as T;
  }
  return input as T;
}

/** The inverse, applied to request bodies before they're sent. */
export function toSnake<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) return input.map((item) => toSnake(item)) as unknown as T;
  if (isPlainObject(input)) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      out[toSnakeKey(key)] = toSnake(value);
    }
    return out as T;
  }
  return input as T;
}

/** Returns true when value is neither null nor undefined — narrows out both. */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/** Returns true when value is not null (undefined still excluded). */
export function isNonNull<T>(value: T | null): value is T {
  return value !== null;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

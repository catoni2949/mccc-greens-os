export function assignClientKeys<T>(
  items: T[],
  prefix: string
): (T & { clientKey: string })[] {
  return items.map((item, i) => ({
    ...item,
    clientKey: `${prefix}${i + 1}`,
  }));
}

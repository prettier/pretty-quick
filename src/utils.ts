export const filterAsync = async <T>(
  items: T[],
  predicate: (item: T) => Promise<boolean>,
) => {
  const boolItems = await Promise.all(items.map(predicate))
  return items.filter((_, i) => boolItems[i])
}

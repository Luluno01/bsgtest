export function mergeSet<T>(a: Iterable<T>, ...b: Iterable<T>[]) {
  const s = new Set<T>(a)
  for (const another of b) {
    for (const elem of another) {
      s.add(elem)
    }
  }
  return s
}

export function diffSet<T>(a: Iterable<T>, b: Set<T>) {
  const s = new Set<T>(a)
  for (const elem of b) {
    s.delete(elem)
  }
  return s
}

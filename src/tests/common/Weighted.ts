import assert from 'assert'


export class Weighted<T> {
  protected weights = new Map<T, number>()
  constructor(
    protected rand: Chance.Chance,
    protected items: T[],
    protected initWeight = 1
  ) {
    for (const item of items) {
      this.weights.set(item, initWeight)
    }
  }

  public get(): T {
    const { rand, items, weights } = this
    return rand.weighted(items, Array.from(weights.values()))
  }

  public inc(it: T, diff = 1) {
    const { weights } = this
    assert(weights.has(it), `No such item: ${it}`)
    weights.set(it, weights.get(it)! + diff)
  }

  public dec(it: T, diff = 1) {
    const { weights } = this
    assert(weights.has(it), `No such item: ${it}`)
    const old = weights.get(it)!
    if (old > diff) weights.set(it, old - diff)
  }

  public decZ(it: T, diff = 1) {
    const { weights } = this
    assert(weights.has(it), `No such item: ${it}`)
    const old = weights.get(it)!
    if (old >= diff) weights.set(it, old - diff)
  }

  public set(it: T, weight = 1) {
    const { weights } = this
    assert(weights.has(it), `No such item: ${it}`)
    weights.set(it, weight)
  }
}

export default Weighted

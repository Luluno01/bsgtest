import Driver, { Ticker } from './Driver'
import Weighted from './Weighted'


export interface TickOpDef {
  tick: Ticker
  /**
   * Reset all weights first
   */
  reset?: boolean
  inc?: string[]
  dec?: string[]
  decZ?: string[]
  set?: string[]
}

class LifeCycle {
  protected weighted: Weighted<TickOpDef>
  constructor(protected readonly rand: Chance.Chance, protected defs: Map<string, TickOpDef>,
    protected initWeight = 2, protected _weightDiff = 1) {
    this.weighted = new Weighted(rand, Array.from(this.defs.values()), initWeight)
  }

  public tick(driver: Driver) {
    const { weighted, defs, initWeight, _weightDiff } = this
    const def = weighted.get()
    const {
      tick,
      reset,
      inc,
      dec,
      decZ,
      set
    } = def
    tick(driver)
    if (reset) {
      for (const mDef of defs.values()) {
        weighted.set(mDef, initWeight)
      }
    }
    // Increase everyone else
    for (const mDef of defs.values()) {
      if (mDef !== def) weighted.inc(mDef, _weightDiff)
    }
    if (inc) {
      this.doInc(inc)
    }
    if (dec) {
      this.doDec(dec)
    }
    if (decZ) {
      this.doDecZ(decZ)
    }
    if (set) {
      this.doSet(set)
    }
  }

  protected doInc(inc: string[]) {
    const { weighted, defs, _weightDiff } = this
    for (const opName of inc) {
      weighted.inc(defs.get(opName)!, _weightDiff)
    }
  }

  protected doDec(dec: string[]) {
    const { weighted, defs, _weightDiff } = this
    for (const opName of dec) {
      weighted.dec(defs.get(opName)!, _weightDiff)
    }
  }

  protected doDecZ(dec: string[]) {
    const { weighted, defs, _weightDiff } = this
    for (const opName of dec) {
      weighted.decZ(defs.get(opName)!, _weightDiff)
    }
  }

  protected doSet(set: string[]) {
    const { weighted, defs, initWeight } = this
    for (const opName of set) {
      weighted.set(defs.get(opName)!, initWeight)
    }
  }
}

export default LifeCycle

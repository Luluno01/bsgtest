import assert from 'assert'
import Driver from './Driver'


export class StateCycle<S> {
  constructor(
    protected readonly rand: Chance.Chance,
    protected stateCov: Map<S, number>,
    protected stateEnt: Map<S, (driver: Driver, dst: S) => void>
  ) {}

  protected nextState() {
    // Ensure uniform coverage
    const states: S[] = []
    const weights: number[] = []
    for (const [ state, cov ] of this.stateCov) {
      states.push(state)
      weights.push(1 / (cov ?? 1))
    }
    return this.rand.weighted(states, weights)
  }

  public tick(driver: Driver) {
    const { stateEnt } = this
    const next = this.nextState()
    const ent = stateEnt.get(next)
    if (!ent) assert.fail(`${next} has no registered entrance`)
    ent(driver, next)
  }
}

export default StateCycle

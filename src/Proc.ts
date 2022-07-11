import { ChildProcess, spawn, SpawnOptionsWithoutStdio } from 'child_process'
import Unreliable, { UnreliableMeta } from '@unlib-js/unreliable'
// import stopOnExit from '@unlib-js/unreliable/build/stopOnExit'
import { once } from 'events'


export class Proc extends Unreliable<ChildProcess> {
  static override meta: UnreliableMeta = {
    states: {
      init: 'init',
      starting: 'starting',
      startFailed: 'start-failed',
      running: 'running',
      stopping: 'stopping',
      stopped: 'stopped'
    },
    stateConf: {
      startable: new Set([ 'init', 'start-failed', 'stopped' ]),
      stoppable: new Set([ 'running', 'stopping' ]),
      abortOnDeath: [ 'starting', 'running' ],
      abortOnStartFailure: [ 'running', 'stopped' ]
    },
    eventHandlers: {},
    deathEvents: [ 'exit' ]
  }
  public cmd: string
  public args: string[]
  public options?: SpawnOptionsWithoutStdio

  constructor(cmd: string, args: string[] = [], options?: SpawnOptionsWithoutStdio) {
    super()
    this.cmd = cmd
    this.args = args
    this.options = options
  }

  public override async start() {
    await super.start()
    // stopOnExit(this)
  }

  protected override async _createAndCheck() {
    const { cmd, args, options } = this
    const proc = spawn(cmd, args, options)
    try {
      await once(proc, 'spawn')
    } catch (err) {
      proc.kill()
      throw err
    }
    return proc
  }

  protected override _stop() {
    this._uObj!.kill()
  }
}

export default Proc

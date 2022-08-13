import Unreliable, { UnreliableMeta } from '@unlib-js/unreliable'
import assert from 'assert'
import BungeeCord from './BungeeCord'


export class Command extends Unreliable<BungeeCord> {
  static override meta: UnreliableMeta = {
    states: {
      init: 'init',
      starting: 'starting',
      startFailed: 'start-failed',
      /**
       * Command running, or finished (since there is no way to tell)
       */
      running: 'running',
      /**
       * The command is to be manually marked as stopped
       */
      stopping: 'stopping',
      /**
       * Indeed 'failed' if it automatically reaches this state;
       * otherwise, it is manually marked as stopped
       */
      stopped: 'stopped'
    },
    stateConf: {
      startable: new Set([ 'init', 'start-failed', 'stopped' ]),
      stoppable: new Set([ 'running', 'stopping' ]),
      abortOnDeath: [ 'starting', 'running' ],
      abortOnStartFailure: [ 'running', 'stopped' ]
    },
    eventHandlers: { line: 'onNewLine' },
    deathEvents: [ 'command-not-found', 'command-failed' ]
  }
  constructor(public readonly cmd: string, public readonly bc: BungeeCord) {
    super()
  }

  protected override async _createAndCheck(): Promise<BungeeCord> {
    const { bc, cmd } = this
    assert(bc.state == 'running')
    bc.stdin.write(cmd)
    return bc
  }

  protected override _stop(): void {
    this._onDeath()  // Explicitly mark as death
  }

  protected onNewLine(line: string) {
    this.notify('line', line)
  }

  public async exec(nLines: number = 1, { timeout = 1000, signal }: {
    timeout?: number,
    signal?: AbortSignal
  } = {}) {
    await this.start()
    const ac = new AbortController
    signal?.addEventListener('abort', ev => ac.abort(ev))
    for await (const _ of this.asIterator('line', { timeout, signal: ac.signal })) {
      if (--nLines <= 0) {
        ac.abort()
        break
      }
    }
    this.stop()
    return this.waitForState('stopped', 1000)
  }
}

export default Command

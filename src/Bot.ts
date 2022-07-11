import Unreliable, { StateChange, StopReason, UnreliableMeta } from '@unlib-js/unreliable'
// import stopOnExit from '@unlib-js/unreliable/build/stopOnExit'
import assert from 'assert'
import mineflayer from 'mineflayer'
import { nameUUIDFromBytes, uuidBufferToString } from './uuid'


export type BotOptions = Parameters<typeof mineflayer.createBot>[0]

export type ChangeToDisconnected = StateChange & StopReason<[ BotError ]>

export class BotError extends Error {
  constructor(public cause: any[], msg?: string) {
    super(msg)
  }
}

export class Bot extends Unreliable<mineflayer.Bot> {
  static override meta: UnreliableMeta = {
    states: {
      init: 'init',
      starting: 'connecting',
      startFailed: 'connect-failed',
      running: 'connected',
      stopping: 'disconnecting',
      stopped: 'disconnected'
    },
    stateConf: {
      startable: new Set([ 'init', 'connect-failed', 'disconnected' ]),
      stoppable: new Set([ 'connected', 'disconnecting' ]),
      abortOnDeath: [ 'connecting', 'connected' ],
      abortOnStartFailure: [ 'connected', 'disconnected' ]
    },
    eventHandlers: {},
    deathEvents: [ 'kicked', 'end', 'error' ]
  }
  public options: BotOptions
  public offlineId: string
  public get username() {
    return this.options.username
  }
  public set username(name: string) {
    assert(this.startable, `Cannot change username right now (state: ${this.state})`)
    this.options.username = name
    this.offlineId = uuidBufferToString(nameUUIDFromBytes('OfflinePlayer:' + name))
  }

  constructor(options: BotOptions) {
    super()
    this.options = options
    this.offlineId = uuidBufferToString(nameUUIDFromBytes('OfflinePlayer:' + options.username))
  }

  public override async start() {
    await super.start()
    // stopOnExit(this)
  }

  protected override async _createAndCheck() {
    return mineflayer.createBot(this.options)
  }

  protected override _stop(): void {
    this._uObj!.quit()
    this._uObj = null
  }

  protected override _onDeath<R extends any[]>(...reason: R): void {
    this._uObj!
      .on('error', () => {})  // Mineflayer does not implement a mechanism to check the connection state, ignore future error anyway
      .end('death')
    super._onDeath(new BotError(reason))
  }
}

export default Bot

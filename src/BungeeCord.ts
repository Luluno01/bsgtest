import Proc from './Proc'
import { createInterface, Interface } from 'readline'
import { setTimeout } from 'timers/promises'
import { ChildProcessWithoutNullStreams, SpawnOptionsWithoutStdio } from 'child_process'
import { Disposable, on } from '@unlib-js/unreliable/build/disposable-events'
import LogParser from './LogParser'


const RE_READY = /^\[\d\d:\d\d:\d\d\ INFO]: Listening on /

export class BungeeCord extends Proc {
  protected readonly log: boolean
  public get stdin() {
    return this._uObj!.stdin!
  }
  protected parser = new LogParser
  public plugins: string[] = []
  public host = 'localhost'
  public port = 25577

  constructor(cmd: string, args: string[] = [], options?: SpawnOptionsWithoutStdio, log = false) {
    super(cmd, args, options)
    this.log = log
  }

  protected override async _createAndCheck() {
    const proc = await super._createAndCheck()
    const { stdout, stderr } = proc
    if (this.log) {
      stdout.pipe(process.stdout)
      stderr.pipe(process.stderr)
    }
    this._disposables.push(
      this.launchLogParser(proc),  // Start async task
      // Putting `launchLogParser` before the ready check below
      // causes stdout to be paused unexpectedly, don't know why
      on(this, 'plugin-enabled', ({ plugin }: { plugin: string }) => this.plugins.push(plugin))
    )
    const rl = createInterface(stdout)
    const ac = new AbortController
    await Promise.race([
      (async () => {
        for await (const line of rl) {
          if (line.match(RE_READY)) {
            rl.close()
            ac.abort()
            return
          }
        }
        // Oops, crashed?
        const err = new Error('Process crashed unexpectedly')
        ac.abort(err)
        proc.kill()
        throw err
      })(),
      (async () => {
        await setTimeout(60000, null, { signal: ac.signal, ref: false })
        const err = new Error('Timeout')
        ac.abort(err)
        rl.close()
        proc.kill()
        throw err
      })()
    ])
    // Bug workaround (stdout could be unexpectedly paused)
    if (stdout.isPaused()) stdout.resume()
    return proc
  }

  protected async parseLog(rl: Interface) {
    const { parser } = this
    for await (const line of rl) {
      this.notify('line', line)
      parser.parse(line, this)
    }
  }

  protected launchLogParser(proc: ChildProcessWithoutNullStreams): Disposable {
    const stdOutRl = createInterface(proc.stdout)
    const stdErrRl = createInterface(proc.stderr)
    this.parseLog(stdOutRl)
    this.parseLog(stdErrRl)
    return {
      dispose() {
        stdOutRl.close()
        stdErrRl.close()
      }
    }
  }

  public override stop(graceful = false) {
    if (graceful) this._uObj!.stdin!.write('end\n')
    else super.stop()
  }

  public async restart() {
    this.stop(true)
    await this.waitForState('stopped')
    await this.start()
    return this.waitForState('running')
  }
}

export default BungeeCord

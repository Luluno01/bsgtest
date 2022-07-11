import assert from 'assert'
import BungeeCord from './BungeeCord'
import Command from './Command'


class ParseState {
  public lazyList: string[] = []
  public nLazy = 0
  public mainList: string[] = []
  public nUUID = 0
}

type ParseHandler = (state: ParseState, line: string) => ParseHandler | null

export class List {
  protected static handleLazyHeader(state: ParseState, line: string) {
    const match = line.match(/^\[\d\d:\d\d:\d\d INFO\]: (?<length>\d+) lazy record\(s\)$/)
    if (!match) return List.handleLazyHeader
    const nLazy = parseInt(match.groups!.length)
    if (nLazy == 0) {
      return List.handleMainHeader
    } else {
      state.nLazy = nLazy
      return List.handleLazyRecord
    }
  }

  protected static handleLazyRecord({ lazyList, nLazy }: ParseState, line: string) {
    const match = line.match(/^\[\d\d:\d\d:\d\d INFO\]:   (?<record>\S+)$/)
    assert.ok(match, 'Expecting a lazy record "  xxx"')
    const currentRecords = lazyList.push(match.groups!.record)
    return currentRecords < nLazy ? List.handleLazyRecord : List.handleMainHeader
  }

  protected static handleMainHeader(state: ParseState, line: string) {
    const match = line.match(/^\[\d\d:\d\d:\d\d INFO\]: (?<length>\d+) UUID record\(s\)/)
    assert.ok(match, 'Expecting log "n UUID record(s)"')
    const nUUID = parseInt(match.groups!.length)
    if (nUUID == 0) {
      return null
    } else {
      state.nUUID = nUUID
      return List.handleMainRecord
    }
  }

  protected static handleMainRecord({ mainList, nUUID }: ParseState, line: string) {
    const match = line.match(/^\[\d\d:\d\d:\d\d INFO\]:   (?<record>\S+)( |$)/)
    assert.ok(match, 'Expecting a UUID record "  xxxx"')
    const currentRecords = mainList.push(match.groups!.record)
    return currentRecords < nUUID ? List.handleMainRecord : null
  }

  public async get(bc: BungeeCord, cmdName: string) {
    const cmd = new Command(`${cmdName} ls\n`, bc)
    await cmd.start()
    const state = new ParseState
    await cmd.abortOnDeath(async _ => {
      let handler: ParseHandler | null = List.handleLazyHeader
      for await (const line of cmd.asIterator<string>('line')) {
        handler = handler(state, line)
        if (!handler) return
      }
    })
    cmd.stop()
    return [ state.lazyList, state.mainList ]
  }
}

export default List

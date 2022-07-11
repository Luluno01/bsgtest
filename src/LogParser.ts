import EventBarrier from '@unlib-js/event-barrier'


export interface Handler<R = any> {
  name: string
  regex: RegExp
  action?: (match: RegExpMatchArray) => R
}

export class LogParser {
  public static handlers: Handler[] = []

  public parse(line: string, dst: EventBarrier) {
    for (const { name, regex, action } of LogParser.handlers) {
      const match = line.match(regex)
      if (match) {
        dst.notify(name, action ? action(match) : match.groups)
        return
      }
    }
  }
}

LogParser.handlers.push(
  { name: 'plugin-enabled', regex: /^\[\d\d:\d\d:\d\d INFO\]: Enabled plugin (?<plugin>[\s\S]+?) version (?<version>[\s\S]+?) by (?<author>[\s\S]+?)$/m },
  { name: 'plugin-load-file-failed', regex: /^\[\d\d:\d\d:\d\d WARN\]: Could not load plugin from file (?<file>[\s\S]+?)$/m },
  { name: 'plugin-load-failed', regex: /^\[\d\d:\d\d:\d\d WARN\]: Error loading plugin (?<plugin>[\s\S]+?)$/m },
  { name: 'plugin-enable-failed', regex: /^\[\d\d:\d\d:\d\d WARN\]: Exception encountered when loading plugin: (?<plugin>[\s\S]+?)$/m },
  { name: 'command-not-found', regex: /^\[\d\d:\d\d:\d\d INFO\]: Command not found$/m },
  { name: 'command-failed', regex: /^\[\d\d:\d\d:\d\d WARN\]: Error in dispatching command$/m }
)

export default LogParser

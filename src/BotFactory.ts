import Bot from './Bot'


export class BotFactory {
  private id = 0
  constructor(protected host: string, protected port: number) {}
  public get() {
    return new Bot({
      host: this.host,
      port: this.port,
      username: `Bot_${this.id++}`,
      checkTimeoutInterval: 60000,
      logErrors: false
    })
  }

  public toLambda() {
    return this.get.bind(this)
  }
}

export default Bot

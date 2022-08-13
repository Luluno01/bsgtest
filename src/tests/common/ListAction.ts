import Bot from '../../Bot'
import Command from '../../Command'
import Context from './Context'
import print from '../../print'
import ShadowLists from './ShadowLists'
import stats from './Stats'


export class ListAction {
  protected queue: Set<Bot> = new Set
  constructor(
    protected ctx: Context,
    protected readonly cmd: string,
    protected readonly getId: (bot: Bot) => string,
    protected readonly updateList: (bot: Bot) => void,
    protected readonly getLor: (this: ShadowLists, it: string) => number
  ) {}

  public enqueue(bot: Bot) {
    this.queue.add(bot)
  }

  public async exec() {
    const { queue, ctx, cmd, getId, updateList, getLor } = this
    print(`Executing "${cmd}" on`, queue.size, 'bot(s)')
    if (!queue.size) return
    let lor = 0
    let args = ''
    for (const bot of queue) {
      bot.addTrace(cmd)
      const id = getId(bot)
      lor += getLor.call(ctx.lists, id)
      args += id + ' '
      updateList(bot)
    }
    queue.clear()
    const mCmd = new Command(`${cmd} ${args}\n`, ctx.bc)
    stats.inc(cmd)
    await mCmd.exec(lor, { timeout: lor * 500 })
  }
}

export default ListAction

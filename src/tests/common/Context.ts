import Chance from 'chance'
import BotRegistry from '../../BotRegistry'
import BungeeCord from '../../BungeeCord'
import ShadowLists from './ShadowLists'


export class Context {
  public readonly rand = new Chance
  public readonly lists = new ShadowLists
  constructor(
    public readonly bc: BungeeCord,
    public readonly bots: BotRegistry
  ) {}
}

export default Context

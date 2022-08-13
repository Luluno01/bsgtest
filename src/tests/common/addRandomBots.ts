import Bot from '../../Bot'
import BotPool from '../../BotPool'
import BungeeCord from '../../BungeeCord'
import Command from '../../Command'
import { randInt } from '../../helpers/rand'
import print from '../../print'


export async function addToListNoOverlap(bc: BungeeCord, bots: Bot[], listNames: string[]) {
  for (const listName of listNames) {
    const cmd = new Command(`${listName} add ${bots.map(bot => bot.offlineId).join(' ')}\n`, bc)
    await cmd.exec(bots.length)
  }
}

export async function addToListOverlap(bc: BungeeCord, bots: Bot[], listNames: string[]) {
  const cmd = new Command(`${listNames[0]} add ${bots.map(bot => bot.offlineId).join(' ')}\n`, bc)
  await cmd.exec(bots.length)  // xxx added to xxx
  for (const listName of listNames.slice(1)) {
    const cmd = new Command(`${listName} add ${bots.map(bot => bot.offlineId).join(' ')}\n`, bc)
    await cmd.exec(bots.length * 2)  // xxx added to xxx; xxx is also in xxx
  }
}

export async function addToLazyListNoOverlap(bc: BungeeCord, bots: Bot[], listNames: string[]) {
  for (const listName of listNames) {
    const cmd = new Command(`${listName} lazy-add ${bots.map(bot => bot.username).join(' ')}\n`, bc)
    await cmd.exec(bots.length)
  }
}

export async function addToLazyListOverlap(bc: BungeeCord, bots: Bot[], listNames: string[]) {
  const cmd = new Command(`${listNames[0]} lazy-add ${bots.map(bot => bot.username).join(' ')}\n`, bc)
  await cmd.exec(bots.length)  // xxx added to xxx
  for (const listName of listNames.slice(1)) {
    const cmd = new Command(`${listName} lazy-add ${bots.map(bot => bot.username).join(' ')}\n`, bc)
    await cmd.exec(bots.length * 2)  // xxx added to xxx; xxx is also in xxx
  }
}

export async function addRandomBots(
  bc: BungeeCord,
  pool: BotPool,
  listNames: string[],
  iters: number,
  maxBotsPerIter: number,
  botFactory: () => Bot,
  addToList: (bc: BungeeCord, bots: Bot[], listNames: string[]) => Promise<void>,
) {
  print('Adding some random bots to list(s):', listNames.join(', '))
  for (let i = 0; i < iters; i++) {
    const nBots = randInt(1, maxBotsPerIter + 1)
    print('Adding', nBots, 'bot(s)')
    const bots: Bot[] = []
    for (let j = 0; j < nBots; j++) {
      const bot = pool.get(botFactory, () => false)
      pool.put(bot)
      bots.push(bot)
    }
    await addToList(bc, bots, listNames)
  }
}

export default addRandomBots

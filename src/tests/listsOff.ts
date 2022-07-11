import assert from 'assert'
import { setTimeout as sleep } from 'timers/promises'
import Bot, { ChangeToDisconnected } from '../Bot'
import BotPool from '../BotPool'
import BungeeCord from '../BungeeCord'
import Command from '../Command'
import { rand, randInt } from '../helpers/rand'
import print from '../print'


export const name = 'lists off'

export const expected = 'anyone can log in when both the whitelist and blacklist are turned off'

async function testOneBot(pool: BotPool, botFactory: () => Bot) {
  const bot = await pool.getOrWait(botFactory, bot => bot.startable)
  print(`[${bot.username}] Connecting`)
  try {
    await bot.start()
  } catch (err) {
    print(`[${bot.username}] Screwed up when starting`)
    throw err
  }
  let stateChange: ChangeToDisconnected
  try {
    stateChange = (await bot.waitForState<ChangeToDisconnected>('disconnected', 5000))!
    print(`[${bot.username}] Disconnected`)
  } catch (err) {
    const code = (<Error & { code?: string }>err).code
    if (code == 'ECONNABORTED' || code == 'ECONNRESET') {
      pool.put(bot)
      print('Warning:', bot.username, `was disconnected with "${code}"`)
      return
    } else {
      print(`[${bot.username}] Failed`)
      throw err
    }
  }
  pool.put(bot)
  const { reason: [ { cause: [ reason, loggedIn ] } ] } = stateChange
  if (reason == 'socketClosed') {
    print('Warning:', bot.username, 'was disconnected with "socketClosed"')
    return
  } else if ((reason as any) instanceof Error) {
    print('Warning:', bot.username, 'was disconnected with an error object:', reason)
  }
  assert(loggedIn, `${bot.username} login failed, reason: ${reason}`)
  assert(
    typeof reason == 'string' && reason.includes('Could not connect to a default or fallback server.'),
    `${bot.username} was disconnect with unexpected reason: ${reason}`
  )
}

export async function test(bc: BungeeCord, botFactory: () => Bot) {
  print('Turning off whitelist and blacklist')
  let cmd = new Command('wlist off\nblist off\n', bc)
  await cmd.start()
  await cmd.waitFor('line', 1000)
  const pool = new BotPool(bc, 3, 10)  // Max concurrency is 3, make it 10 just in case
  let successful = 0
  const iters = 200
  print(iters, 'iterations to go')
  for (let i = 0; i < iters; i++) {
    await sleep(rand(0, 3000))
    const concurrency = randInt(1, 3 + 1)
    const percentage = Math.round(i / iters * 100 * 100) / 100
    print(percentage, '% -', concurrency, 'bot(s),', successful, 'ok')
    const tasks: Promise<void>[] = []
    for (let i = 0; i < concurrency; i++) {
      tasks.push(
        (async () => {
          await testOneBot(pool, botFactory)
          successful++
        })()
      )
    }
    await Promise.all(tasks)
  }
  assert(successful > iters * 0.5, `Too many ignored fails, only ${successful} successful connections`)
}

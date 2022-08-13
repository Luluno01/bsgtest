import assert from 'assert'
import { setTimeout } from 'timers/promises'
import { rand, randInt } from '../../helpers/rand'
import print from '../../print'


async function testConcurrently(
  iters: number,
  [ minCon = 1, maxCon = 3 ]: [ number, number ],
  job: () => Promise<boolean>
) {
  let successful = 0
  print(iters, 'iterations to go')
  for (let i = 0; i < iters; i++) {
    await setTimeout(rand(100, 800))
    const concurrency = randInt(minCon, maxCon + 1)
    const percentage = Math.round(i / iters * 100 * 100) / 100
    print(percentage, '% -', concurrency, 'bot(s),', successful, 'ok')
    const tasks: Promise<void>[] = []
    for (let j = 0; j < concurrency; j++) {
      tasks.push(
        (async () => {
          if (await job()) successful++
        })()
      )
    }
    await Promise.all(tasks)
  }
  assert(successful > iters * 0.5, `Too many ignored fails, only ${successful} successful connections`)
}

export default testConcurrently

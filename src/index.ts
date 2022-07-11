import { createWriteStream, constants as fsConstants } from 'fs'
import { access, copyFile, readdir } from 'fs/promises'
import path from 'path'
import { setTimeout } from 'timers/promises'
import Bot from './Bot'
import BungeeCord from './BungeeCord'
import * as waterfall from './waterfall'
import assert from 'assert'
import List from './List'


const BC_WORK_DIR = 'bc'
const HOST = 'localhost'
const PORT = 25577

function print(...args: any[]) {
  console.log('>>>>', ...args)
}

async function prepareWaterfall() {
  const buildList = await waterfall.fetchBuilds()
  const build = buildList.builds[buildList.builds.length - 1]
  const name = build.downloads.application.name
  const jarPath = path.join(BC_WORK_DIR, name)
  try {
    await access(jarPath, fsConstants.F_OK)
    print(jarPath, 'exists')
  } catch {
    print('Downloading', name)
    await waterfall.downloadBuild(build, createWriteStream(jarPath))
  }
  return name
}

async function prepareConfig() {
  const srcPath = require.resolve('../bc/config.yml')
  const dstPath = path.resolve(BC_WORK_DIR, 'config.yml')
  if (srcPath != dstPath) {
    print('Copying', srcPath, 'to', dstPath)
    await copyFile(srcPath, dstPath)
    return dstPath
  } else {
    print('Using', srcPath, 'as config')
    // Return undefined
  }
}

async function checkEnv(dir: string) {
  await assert.doesNotReject(access(dir, fsConstants.O_DIRECTORY), `${dir} must be created with plugins installed`)
  const pluginDir = path.join(dir, 'plugins')
  await assert.doesNotReject(access(pluginDir, fsConstants.O_DIRECTORY), `Plugin directory ${pluginDir} must be created with plugins installed`)
  const plugins = await readdir(pluginDir)
  assert.ok(plugins.some(file => file.startsWith('BungeeSafeguard') && file.endsWith('.jar')), `${pluginDir} must includes "BungeeSafeguard*.jar"`)
}

async function ensureEmptyList(bc: BungeeCord) {
  const list = new List
  let lists = await list.get(bc, 'wlist')
  assert(lists.every(l => !l.length), 'Refuse to test on non-empty list(s)')
  lists = await list.get(bc, 'blist')
  assert(lists.every(l => !l.length), 'Refuse to test on non-empty list(s)')
}

interface Test {
  name: string
  expected: string
  test: (bc: BungeeCord, botFactory: () => Bot) => Promise<void>
}

async function loadTests(dir: string): Promise<[ string, Test ][]> {
  const base = path.dirname(__filename)
  const absDir = path.join(base, dir)
  const tests: Promise<[ string, Test ]>[] = []
  for (const file of await readdir(absDir)) {
    if (file.endsWith('.js')) {
      tests.push((async () => {
        const testPath = path.join(absDir, file)
        let relTestPath = path.relative(base, testPath)
        if (!relTestPath.startsWith('./')) relTestPath = './' + relTestPath
        return [ relTestPath, await import(testPath) ]
      })())
    }
  }
  return Promise.all(tests)
}

class BotFactory {
  private id = 0
  public get() {
    return new Bot({
      host: HOST,
      port: PORT,
      username: `Bot_${this.id++}`,
      checkTimeoutInterval: 60000,
      logErrors: false
    })
  }

  public toLambda() {
    return this.get.bind(this)
  }
}

class TestContext {
  public botFactory = (new BotFactory).toLambda()
  constructor(public bc: BungeeCord) {}
}

async function execTest({ bc, botFactory }: TestContext, testFile: string, test: Test) {
  print('Starting test:', test.name)
  print('Expected outcome:', test.expected)
  try {
    await test.test(bc, botFactory)
  } catch (err) {
    print('Test failed:', test.name)
    print('Defined in file', testFile)
    throw err
  }
}

async function main() {
  await checkEnv(BC_WORK_DIR)
  // Prepare test
  const [ wfJar, _ ] = await Promise.all([ prepareWaterfall(), prepareConfig() ])
  const bc = new BungeeCord('java', [ '-jar', wfJar ], { cwd: BC_WORK_DIR }, true)
  await bc.start()
  print('Plugins:', bc.plugins)
  assert(bc.plugins.some(plugin => plugin == 'BungeeSafeguard'), 'BungeeSafeguard is not enabled')
  await setTimeout(500)
  await ensureEmptyList(bc)
  const loadedTests = await loadTests('./tests')
  const nTests = loadTests.length
  print(nTests, 'tests loaded')
  const ctx = new TestContext(bc)
  for (const [ testFile, test ] of loadedTests) {
    try {
      await execTest(ctx, testFile, test)
    } finally {
      await setTimeout(500)
      if (bc.stoppable) bc.stop(true)
      try {
        await bc.waitForState('stopped', 5000)
        print('BungeeCord gracefully stopped')
      } catch {
        print('Force stopping BungeeCord')
        bc.stop(false)
        await bc.waitForState('stopped')
      }
    }
  }
}

main()

import { once } from 'events'
import { WriteStream } from 'fs'


const BUILD_LIST_URL = 'https://api.papermc.io/v2/projects/waterfall/version_group/1.19/builds'

interface Change {
  commit: string
  summary: string
  message: string
}

interface Download {
  name: string
  sha256: string
}

interface Build {
  version: string
  build: number
  time: string
  channel: string
  promoted: boolean
  changes: Change[]
  downloads: {
    application: Download
    [key: string]: Download
  }
}

interface BuildList {
  project_id: string
  project_name: string
  version_group: string
  versions: string[]
  builds: Build[]
}

export async function fetchBuilds() {
  return (await fetch(BUILD_LIST_URL)).json() as Promise<BuildList>
}

const BUILD_BASE_URL = 'https://api.papermc.io/v2/projects/waterfall/versions/'
// https://api.papermc.io/v2/projects/waterfall/versions/1.19/builds/497/downloads/waterfall-1.19-497.jar

export async function downloadBuild(build: Build, out: WriteStream, options: { end?: boolean } = { end: true }) {
  const url = `${BUILD_BASE_URL}${build.version}/builds/${build.build}/downloads/${build.downloads.application.name}`
  const res = await fetch(url)
  const blob = await res.blob()
  for await (const data of blob.stream()) {
    out.write(data)
  }
  const { end = true } = options
  if (end) {
    out.end()
  }
  await once(out, 'close')
}

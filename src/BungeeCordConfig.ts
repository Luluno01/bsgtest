import { readFile } from 'fs/promises'
import url from 'url'
import { parse as parseYaml } from 'yaml'


export default interface BungeeCordConfig {
  enforce_secure_profile: boolean
  listeners: {
    query_port: number
    motd: string
    tab_list: string
    query_enabled: boolean
    proxy_protocol: boolean
    forced_hosts: {
      [key: string]: string
    }
    ping_passthrough: boolean
    priorities: string[]
    bind_local_address: boolean
    host: string
    max_players: number
    tab_size: number
    force_default_server: boolean
  }[]
  remote_ping_cache: number
  network_compression_threshold: number
  permissions: {
    default: string[]
    admin: string[]
  }
  log_pings: boolean
  connection_throttle_limit: number
  server_connect_timeout: number
  timeout: number
  stats: string
  player_limit: number
  ip_forward: boolean
  groups: {
    [key: string]: string[]
  }
  remote_ping_timeout: number
  connection_throttle: number
  log_commands: boolean
  prevent_proxy_connections: boolean
  online_mode: boolean
  forge_support: boolean
  disabled_commands: string[]
  servers: {
    [key: string]: {
      motd: string
      address: string
      restricted: boolean
    }
  }
}

export async function loadConfig(confPath: string) {
  const rawConf = (await readFile(confPath)).toString()
  return parseYaml(rawConf) as BungeeCordConfig
}

export function getPort(config: BungeeCordConfig) {
  const { listeners: [ { host } ] } = config
  const { port } = url.parse(`tcp://${host}`)
  return parseInt(port!)
}

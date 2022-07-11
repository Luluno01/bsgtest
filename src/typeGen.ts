import assert from "assert"

export enum Type {
  NUMBER,
  STRING,
  BOOLEAN,
  OBJECT,
  ARRAY,
  NULL
}

export interface TsType {
  name?: string
  type: Type
  children?: TsType[]
}

export function genType(obj: any, name?: string): TsType {
  switch (typeof obj) {
    case 'number': return { name, type: Type.NUMBER }
    case 'string': return { name, type: Type.STRING }
    case 'boolean': return { name, type: Type.BOOLEAN }
  }
  if (obj instanceof Array) {
    if (obj.length) {
      return { name, type: Type.ARRAY, children: [ genType(obj[0]) ] }
    } else {
      return { name, type: Type.ARRAY }
    }
  } else if (obj === null || obj === undefined) {
    return { name, type: Type.NULL }
  }
  const children: TsType[] = []
  for (const [ key, value ] of Object.entries(obj)) {
    children.push(genType(value, key))
  }
  return { name, type: Type.OBJECT, children }
}

function doBuildType(type: TsType, indent: string): string {
  const { name } = type
  const prefix = name ? `${name}: ` : ''
  switch (type.type) {
    case Type.NUMBER: return `${prefix}number`
    case Type.STRING: return `${prefix}string`
    case Type.BOOLEAN: return `${prefix}boolean`
    case Type.NULL: return `${prefix}any`
    case Type.ARRAY: {
      const { children } = type
      if (!children || !children.length) {
        return `${prefix}[]`
      }
      if (children.length == 1) {
        return `${prefix}${doBuildType(children[0], indent)}[]`
      }
      const childTypes = children.map(ty => doBuildType(ty, '')).join(', ')
      return `${prefix}[ ${childTypes} ]`
    }
    case Type.OBJECT: {
      const newlineIndent = indent + '  '
      const childTypes = type.children!.map(ty => newlineIndent + doBuildType(ty, newlineIndent)).join('\n')
      return `${prefix}{\n${childTypes}\n${indent}}`
    }
  }
}

export function buildType(type: TsType) {
  assert(type.type == Type.OBJECT)
  return doBuildType(type, '')
}

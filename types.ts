import { CLI } from './spektr.ts'

type OptionType = boolean | string | number

type Option = {
  short?: string
  name: string
  description?: string
  type: 'string' | 'boolean'
  required?: boolean
}

type Positionals = (string | number)[]

type TypeConverter<T extends string> = T extends 'string' ? string
  : T extends 'boolean' ? boolean
  : T extends 'number' ? number
  : never

type ParsedOptions<T extends readonly Option[]> = {
  [K in T[number] as K['name']]: TypeConverter<K['type']>
}

type Action<
  P extends Positionals,
  T extends readonly Option[],
> = (
  positionals: P,
  options: ParsedOptions<T>,
) => void

type Command<
  P extends Positionals = Positionals,
  T extends readonly Option[] = readonly Option[],
> = {
  path: string[]
  name: string
  action: Action<P, T>
  options: T
  _builtin?: boolean
  description?: string
  default?: boolean
}

type Params<T> = {
  readonly options?: T
  default?: boolean
  description?: string
}

type Plugin = (cli: Readonly<CLI>) => Pick<CLI, 'helpFn' | 'helpMessage'>

export type {
  Action,
  Command,
  Option,
  OptionType,
  Params,
  ParsedOptions,
  Plugin,
  Positionals,
}

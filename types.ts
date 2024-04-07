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
  T extends readonly Option[],
> = (
  positionals: Positionals,
  options: ParsedOptions<T>,
) => void

type Command<T extends readonly Option[] = readonly Option[]> = {
  path: string[]
  name: string
  action: Action<T>
  options: T
  _builtin?: boolean
  description?: string
}

type Params<T> = {
  readonly options?: T
  default?: boolean
  description?: string
}

export type {
  Action,
  Command,
  Option,
  OptionType,
  Params,
  ParsedOptions,
  Positionals,
}

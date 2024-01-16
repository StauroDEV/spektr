type OptionType = boolean | string | number

type Option = {
  aliases?: string[]
  name: string
  description?: string
  type: 'boolean' | 'string' | 'number'
  required?: boolean
}

type ParsedOptions = Record<string, boolean | string | number>

type Positionals = (string | number)[]

type Action = (
  positionals: Positionals,
  options: ParsedOptions,
) => void

type Command = {
  path: string[]
  name: string
  action: Action
  options: Option[]
}

export type { Action, Command, Option, OptionType, ParsedOptions, Positionals }

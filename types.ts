type OptionType = boolean | string | number

type Option = {
  aliases?: string[]
  name: string
  description?: string
  type: 'boolean' | 'string' | 'number'
}

type Action = (
  positionals: (string | number)[],
  options: Record<string, boolean | string | number>,
) => void

type Command = {
  path: string
  name: string
  action: Action
  options: Option[]
}

export type { Action, Command, Option, OptionType }

import type { Option, OptionType } from './types.ts'
import detect from 'https://deno.land/x/type_detect@v4.0.8/index.js'

export const validateArgs = (
  options: Record<string, OptionType>,
  schema: Option[],
) => {
  for (const [arg, value] of Object.entries(options)) {
    const option = schema.find((opt) =>
      opt.aliases.includes(arg) || opt.name === arg
    )
    if (!option) throw new Error(`Unknown argument: ${arg}`)

    if (option.type !== detect(value)) {
      throw new Error(
        `Invalid argument type: expected ${option.type}, got ${typeof value}`,
      )
    }
  }
  return options
}

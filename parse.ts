import typeDetect from 'type-detect'
import type { Option, ParsedOptions } from './types.ts'
import { parseArgs, type ParseArgsConfig } from 'node:util'

export const handleArgParsing = <
  T extends readonly Option[] = readonly Option[],
>(
  { options }: { options: T },
  args: string[],
  parseOptions?: ParseArgsConfig,
): {
  positionals: (string | number)[]
  parsed: ParsedOptions<typeof options>
} => {
  const { positionals, values: parsed } = parseArgs({
    ...parseOptions,
    args,
    options: options.reduce((acc, curr) => {
      acc[curr.name] = {
        type: curr.type,
        ...(curr.short ? { short: curr.short } : {}),
      }
      return acc
    }, {} as NonNullable<ParseArgsConfig['options']>),
    allowPositionals: true,
    strict: false,
  })

  const requiredOptions = options.filter((opt) => opt.required)

  const parsedArgs = Object.entries(parsed)

  for (const opt of requiredOptions) {
    if (
      !parsedArgs.find((arg) => arg[0] === opt.name || arg[0] === opt.short)
    ) {
      throw new Error(`Argument ${opt.name} is required`)
    }
  }

  for (const [arg, value] of parsedArgs) {
    const opt = options.find((x) => x.name === arg || x.short === arg)
    // @ts-expect-error type-detect has incorrect types
    const actualType = typeDetect(value)
    if (!opt) throw new Error(`Unknown argument: ${arg}`)
    if (actualType !== opt.type) {
      throw new Error(
        `Invalid argument type for ${arg}: expected ${opt.type}, got ${actualType}`,
      )
    }
  }

  return {
    positionals,
    parsed: parsed as ParsedOptions<typeof options>,
  }
}

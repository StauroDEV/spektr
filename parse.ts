import {
  parseArgs,
  ParseOptions,
} from 'https://deno.land/std@0.212.0/cli/parse_args.ts'
import typeDetect from 'https://deno.land/x/type_detect@v4.0.8/index.js'
import { Option } from './types.ts'

export const handleArgParsing = (
  { options }: { options: Option[] },
  args: string[],
  parseOptions?: ParseOptions,
): {
  positionals: (string | number)[]
  parsed: Record<string, boolean | string | number>
} => {
  const alias: Record<string, string[]> = options.reduce(
    (acc, option) => {
      acc[option.name] = option.aliases || []
      return acc
    },
    {} as Record<string, string[]>,
  )

  const { _: positionals, ...parsed } = parseArgs(
    args,
    {
      alias,
      boolean: true,
      ...parseOptions,
    },
  )

  for (const [arg, value] of Object.entries(parsed)) {
    const opt = options.find((x) =>
      x.name === arg || (x.aliases || []).includes(arg)
    )
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
    parsed: parsed as Record<string, boolean | string | number>,
  }
}

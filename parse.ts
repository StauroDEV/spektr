import {
  parseArgs,
  ParseOptions,
} from 'https://deno.land/std@0.212.0/cli/parse_args.ts'
import typeDetect from 'https://deno.land/x/type_detect@v4.0.8/index.js'
import { Option, ParsedOptions } from './types.ts'

export const handleArgParsing = <
  T extends readonly Option[] = readonly Option[],
>(
  { options }: { options: T },
  args: string[],
  parseOptions?: ParseOptions,
): {
  positionals: (string | number)[]
  parsed: ParsedOptions<typeof options>
} => {
  const alias: Record<string, string[]> = options.reduce(
    (acc, option) => {
      acc[option.name] = option.aliases as string[] || []
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

  const requiredOptions = options.filter((opt) => opt.required)

  const parsedArgs = Object.entries(parsed)

  for (const opt of requiredOptions) {
    if (
      !parsedArgs.find((arg) =>
        arg[0] === opt.name || (opt.aliases || []).includes(arg[0])
      )
    ) {
      throw new Error(`Argument ${opt.name} is required`)
    }
  }

  for (const [arg, value] of parsedArgs) {
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
    parsed: parsed as ParsedOptions<typeof options>,
  }
}

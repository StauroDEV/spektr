import { parseArgs } from 'https://deno.land/std@0.209.0/cli/parse_args.ts'
import { Action, Command, Option, OptionType } from './types.ts'
import typeDetect from 'https://deno.land/x/type_detect@v4.0.8/index.js'

const commonArgs: Record<string, string[]> = {
  version: ['v'],
  help: ['h'],
}

const handleArgParsing = ({ options }: Command, args: string[]) => {
  const aliases: Record<string, string[]> = options.reduce(
    (acc, option) => {
      acc[option.name] = option.aliases
      return acc
    },
    {} as Record<string, string[]>,
  )

  const { _: positionals, ...parsed } = parseArgs<
    Record<string, string>,
    undefined,
    boolean,
    string,
    undefined,
    undefined,
    undefined,
    Record<string, string[]>
  >(
    args,
    {
      alias: { ...commonArgs, ...aliases },
      boolean: true,
    },
  )

  for (const [arg, value] of Object.entries(parsed)) {
    const opt = options.find((x) => x.name === arg || x.aliases.includes(arg))!
    const actualType = typeDetect(value)
    if (!opt) throw new Error(`Unknown argument: ${arg}`)
    if (actualType !== opt.type) {
      throw new Error(
        `Invalid argument type for ${arg}: expected ${opt.type}, got ${actualType}`,
      )
    }
  }

  return { positionals, parsed }
}

export class Clif {
  name?: string
  prefix = ''
  #commands: Command[] = []
  #programs: Clif[] = []
  constructor(opts: { name?: string; prefix?: string } = {}) {
    const { name, prefix } = opts
    this.name = name
    this.prefix = prefix || ''
  }
  command(
    { name = '', options = [] }: { name?: string; options?: Option[] },
    action: Action,
  ) {
    this.#commands.push({
      name,
      action,
      path: `${this.prefix ? this.prefix + ' ' : ''}${name}`,
      options,
    })
  }
  handle(args = Deno.args): void {
    const fullPath = args.join(' ')

    if (fullPath === '' && this.prefix === '') return this.help()

    const command = this.#commands.find((command) =>
      fullPath.includes(command.path)
    )
    const program = this.#programs.find((program) =>
      fullPath.includes(program.prefix)
    )

    if (program) {
      return program.handle(args.slice(1))
    } else if (command) {
      const { positionals, parsed } = handleArgParsing(command!, args)

      command.action(positionals, parsed)

      return
    } else throw new Error('Command not found')
  }
  program(prefix: string, program: Clif) {
    program.prefix = prefix
    this.#programs.push(program)
    return this
  }
  version(version = '0.0.0', misc = `Deno: ${Deno.version.deno}`) {
    this.command({
      options: [{
        name: 'version',
        aliases: ['v'],
        type: 'boolean',
      }],
    }, () => {
      console.log(`${this.name}: ${version}\n${misc}`)
    })
  }
  help() {
    console.log(`Usage: wip`)
  }
}

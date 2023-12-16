import { parseArgs } from 'https://deno.land/std@0.209.0/cli/parse_args.ts'
import { Action, Command, Option, OptionType } from './types.ts'
import { validateArgs } from './args.ts'

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
  parse(args = Deno.args) {
    const { _: positionals, ...parsed } = parseArgs(args)

    this.handle(positionals, parsed)
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
  handle(
    positionals: (string | number)[],
    args: Record<string, OptionType>,
  ): void {
    const fullPath = positionals.join(' ')

    const command = this.#commands.find((command) =>
      fullPath.includes(command.path)
    )
    const program = this.#programs.find((program) =>
      fullPath.includes(program.prefix)
    )

    if (program) return program.handle(positionals.slice(1), args)
    else if (command) {
      command.action(positionals, validateArgs(args, command.options))

      return
    } else throw new Error('Command not found')
  }
  program(prefix: string, program: Clif) {
    program.prefix = prefix
    this.#programs.push(program)
    return this
  }
}

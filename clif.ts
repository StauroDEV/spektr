import {
  parseArgs,
  ParseOptions,
} from 'https://deno.land/std@0.209.0/cli/parse_args.ts'
import { Action, Command, Option } from './types.ts'
import typeDetect from 'https://deno.land/x/type_detect@v4.0.8/index.js'

const handleArgParsing = (
  { options }: Command,
  args: string[],
  parseOptions?: ParseOptions,
): {
  positionals: (string | number)[]
  parsed: Record<string, boolean | string | number>
} => {
  const alias: Record<string, string[]> = options.reduce(
    (acc, option) => {
      acc[option.name] = option.aliases
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
    const opt = options.find((x) => x.name === arg || x.aliases.includes(arg))
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

export class Clif {
  name?: string
  prefix = ''
  #commands: Command[] = []
  #programs: Clif[] = []
  #parseOptions?: ParseOptions
  constructor(
    opts: { name?: string; prefix?: string } & ParseOptions = {},
  ) {
    const { name, prefix, ...parseOptions } = opts
    this.name = name
    this.prefix = prefix || ''
    this.#parseOptions = parseOptions
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

    if (fullPath === '' && this.prefix === '') return console.log(this.#help())

    const commands = this.#commands.filter((command) =>
      fullPath.startsWith(command.path) && args.includes(command.name)
    )
    const program = this.#programs.find((program) =>
      fullPath.startsWith(program.prefix) && args.includes(program.prefix)
    )

    if (program) {
      return program.handle(args.slice(1))
    } else if (commands) {
      // In case of multiple commands under the same, look for the one who has same options
      const cmd =
        commands.length > 1 && fullPath.includes('--') || fullPath.includes('-')
          ? commands.find((c) =>
            c.options.find((o) =>
              args.find((arg) => arg.startsWith(`--${o.name}`)) ||
              o.aliases.find((a) =>
                args.find((arg) =>
                  arg.slice(0, 2) === `-${a}` &&
                  (arg[2] === '' || arg[2] === undefined)
                )
              )
            )
          )
          : commands.sort((x, y) => y.path.length - x.path.length)[0]

      if (!cmd) throw new Error('Command not found')

      const { positionals, parsed } = handleArgParsing(
        cmd,
        args,
        this.#parseOptions,
      )

      cmd.action(positionals, parsed)

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
  #help() {
    const defaultCommandOptions = this.#commands.filter((cmd) =>
      cmd.name === ''
    ).map((cmd) => cmd.options).map((options) =>
      options.map((opt) =>
        [`--${opt.name}`, ...opt.aliases.map((a) => `-${a}`)].join(' | ')
      )
    ).map((fmt) => `[${fmt}]`).join(' ')

    let helpMessage = `Usage: ${
      this.name ? this.name + ' ' : ''
    }[command] ${defaultCommandOptions}${
      this.#commands.filter((c) => c.name !== '').length ? `\n\nCommands:` : ''
    }\n`

    const appendCommands = (commands: Command[], prefix = '') => {
      commands.forEach((command) => {
        if (command.name) helpMessage += `  ${prefix}${command.path}\n`
      })
    }

    appendCommands(this.#commands)

    const appendPrograms = (programs: Clif[], prefix = '') => {
      programs.forEach((program) => {
        const programPrefix = `${prefix}${
          program.prefix ? program.prefix + ' ' : ''
        }`
        helpMessage += `\nCommands for ${programPrefix.trimEnd()}:\n`
        appendCommands(program.#commands, programPrefix)
        appendPrograms(program.#programs, programPrefix)
      })
    }

    appendPrograms(this.#programs)

    return helpMessage
  }
  help() {
    this.command({
      options: [{
        name: 'help',
        aliases: ['h'],
        type: 'boolean',
      }],
    }, () => {
      console.log(this.#help())
    })
  }
}

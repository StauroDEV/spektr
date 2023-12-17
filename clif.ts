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

const hasOptions = (args: string[]) =>
  args.find((arg) =>
    (arg.startsWith(`--`) || arg.startsWith(`-`)) && arg !== '--' && arg !== '-'
  )

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
    nameOrAction: string | Action,
    actionOrOptions: Action | { options: Option[] } = { options: [] },
    params: { options: Option[] } = { options: [] },
  ) {
    const options = 'options' in actionOrOptions
      ? actionOrOptions.options
      : params.options

    const common = {
      path: `${this.prefix ? this.prefix + ' ' : ''}${
        typeof nameOrAction === 'string' ? nameOrAction : ''
      }`,
      options,
    }
    if (typeof nameOrAction === 'string') {
      if (typeof actionOrOptions !== 'function') {
        throw new Error(`Command action for ${nameOrAction} is required`)
      }
      this.#commands.push({
        name: nameOrAction,
        action: actionOrOptions,
        ...common,
      })
    } else {
      this.#commands.push({
        name: '',
        action: nameOrAction,
        ...common,
      })
    }
  }
  handle(args = Deno.args): void {
    if (args.length === 0 && this.prefix === '') {
      return console.log(this.#help())
    }

    const commands = this.#commands.filter((command) => {
      if (args.length === 0) return command.name === ''
      else {
        return command.path !== '' &&
          args.join(' ').includes(command.path)
      }
    })

    const program = this.#programs.find((program) => args[0] === program.prefix)

    if (program) {
      return program.handle(args)
    } else if (commands) {
      // In case of multiple commands under the same, look for the one who has same options
      const cmd = commands.length > 1 && hasOptions(args)
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
    this.command(() => {
      console.log(`${this.name}: ${version}\n${misc}`)
    }, {
      options: [{
        name: 'version',
        aliases: ['v'],
        type: 'boolean',
      }],
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

    const appendCommands = (commands: Command[]) => {
      commands.forEach((command) => {
        if (command.name) helpMessage += `  ${command.path}\n`
      })
    }

    appendCommands(this.#commands)

    const appendPrograms = (programs: Clif[]) => {
      programs.forEach((program) => {
        helpMessage += `\nCommands for ${program.prefix}:\n`
        appendCommands(program.#commands)
        appendPrograms(program.#programs)
      })
    }

    appendPrograms(this.#programs)

    return helpMessage
  }
  help() {
    this.command(() => {
      console.log(this.#help())
    }, {
      options: [{
        name: 'help',
        aliases: ['h'],
        type: 'boolean',
      }],
    })
  }
}

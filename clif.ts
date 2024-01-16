import { type ParseOptions } from 'https://deno.land/std@0.212.0/cli/parse_args.ts'
import { getBorderCharacters, table } from 'https://esm.sh/table@6.8.1'
import { Action, Command, Option } from './types.ts'
import { handleArgParsing } from './parse.ts'
import { findExactCommand, hasOptions, makeFullPath } from './utils.ts'

export class CLI {
  name?: string
  prefix?: string
  parent?: CLI
  #commands: Command[] = []
  #programs: CLI[] = []
  #parseOptions?: ParseOptions
  constructor(
    opts: { name?: string; prefix?: string } & ParseOptions = {},
  ) {
    const { name, prefix, ...parseOptions } = opts
    this.name = name
    this.prefix = prefix
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
      path: makeFullPath(
        this,
        typeof nameOrAction === 'string' ? [nameOrAction] : undefined,
      ),
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

  #find(
    args: string[],
  ): Command[] {
    return this.#commands.filter((command) => {
      if (args.length === 0) return command.name === ''
      else {
        return command.path.length !== 0 &&
          command.path.every((item) => args.includes(item))
      }
    })
  }

  handle(args = Deno.args): void {
    if (args.length === 0 && !this.prefix) {
      return console.log(this.#help())
    }

    if (hasOptions(args.slice(0, 1))) {
      const cmd = findExactCommand(this.#find([]), args)

      if (!cmd) throw new Error('Command not found')

      const { positionals, parsed } = handleArgParsing(
        cmd,
        args,
        this.#parseOptions,
      )

      return cmd.action(positionals.slice(cmd.path.length), parsed)
    }

    const fullPath = makeFullPath(this)

    const commands = this.#find([...fullPath, ...args])

    const program = this.#programs.find((program) => args[0] === program.prefix)

    if (program) {
      return program.handle(args.slice(1))
    } else if (commands.length > 0) {
      // In case of multiple commands under the same, look for the one who has same options
      const cmd = findExactCommand(commands, args)

      if (!cmd) throw new Error('Command not found')

      const { positionals, parsed } = handleArgParsing(
        cmd,
        args,
        this.#parseOptions,
      )

      return cmd.action(positionals.slice(cmd.path.length), parsed)
    } else throw new Error('Command not found')
  }
  program(prefix: string, program = new CLI({ name: prefix, prefix })) {
    program.prefix = prefix
    program.parent = this
    this.#programs.push(program)
    return program
  }
  version(version = '0.0.0', misc = `Deno: ${Deno.version.deno}`) {
    this.command(() => {
      console.log(
        this.name
          ? `${this.name}: ${version}\n${misc}`
          : `Clif: ${version}\n${misc}`,
      )
    }, {
      options: [{
        name: 'version',
        aliases: ['v'],
        type: 'boolean',
        description: 'shows current version',
      }],
    })
  }
  #help() {
    const defaultCommands = this.#commands.filter((cmd) => cmd.name === '')

    const defaultCommandOptions = defaultCommands.map((cmd) => cmd.options).map(
      (options) =>
        options.map((opt) =>
          opt.aliases ? `-${opt.aliases[0]}` : `--${opt.name}`
        ),
    ).map((fmt) => `[${fmt}]`).join(' ')

    const getParentName = (cli: CLI | null): string => {
      if (cli?.parent) {
        return `${getParentName(cli.parent)} ${cli.name}`
      } else {
        return cli?.name || ''
      }
    }

    let helpMessage = `Usage: ${
      getParentName(this)
    } [command] ${defaultCommandOptions}${
      this.#commands.filter((c) => c.name !== '').length ? `\n\nCommands:` : ''
    }\n`

    const appendCommands = (commands: Command[]) => {
      commands.forEach((command) => {
        if (command.name) helpMessage += `  ${command.name}\n`
      })
    }

    appendCommands(this.#commands)

    const appendPrograms = (programs: CLI[]) => {
      programs.forEach((program) => {
        helpMessage += `\nCommands for ${getParentName(program)}:\n`
        appendCommands(program.#commands)
        appendPrograms(program.#programs)
      })
    }
    if (!this.prefix || this.parent) {
      appendPrograms(this.#programs)
    }
    if (defaultCommands.length !== 0) {
      helpMessage += `\nOptions:\n`
      const layout: string[][] = []
      defaultCommands.forEach((command) =>
        command.options.forEach((option) => {
          layout.push([
            [
              `--${option.name}`,
              ...((option.aliases || []).map((a) => `-${a}`)),
            ].join(', '),
            option.description || '',
          ])
        })
      )

      helpMessage += table(layout, {
        border: getBorderCharacters('void'),
        columnDefault: {
          paddingLeft: 4,
        },
        drawHorizontalLine: () => false,
      })
    }

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
        description: 'shows this message',
      }],
    })
  }
}

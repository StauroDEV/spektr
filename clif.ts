import { type ParseOptions } from 'https://deno.land/std@0.212.0/cli/parse_args.ts'
import { getBorderCharacters, table } from 'https://esm.sh/table@6.8.1'
import { Action, Command, Option } from './types.ts'
import { handleArgParsing } from './parse.ts'
import {
  findDeepestParent,
  findExactCommand,
  handleActionWithHelp,
  isAnonymousCommand,
  makeFullPath,
} from './utils.ts'

export class CLI {
  name?: string
  prefix?: string
  parent?: CLI
  commands: Command[] = []
  #defaultCommand?: Command
  programs: CLI[] = []
  #parseOptions?: ParseOptions
  constructor(
    opts: { name?: string; prefix?: string } & ParseOptions = {},
  ) {
    const { name, prefix, ...parseOptions } = opts
    this.name = name
    this.prefix = prefix
    this.#parseOptions = parseOptions
  }
  command<T extends readonly Option[] = readonly Option[]>(
    name: string,
    action: Action<T>,
    params?: { readonly options?: T; default?: boolean },
  ): CLI

  command<T extends readonly Option[] = readonly Option[]>(
    name: string,
    action: Action<T>,
  ): CLI

  command<T extends readonly Option[] = readonly Option[]>(
    action: Action<T>,
    params?: { readonly options?: T; default?: boolean },
  ): CLI

  command<T extends readonly Option[] = readonly Option[]>(
    nameOrAction: string | Action<T>,
    actionOrOptions?: Action<T> | { readonly options?: T; default?: boolean },
    params?: { readonly options?: T; default?: boolean },
  ): CLI {
    const options =
      (actionOrOptions && 'options' in actionOrOptions
        ? actionOrOptions.options
        : params?.options) || [] as unknown as T

    const isDefault = actionOrOptions && 'default' in actionOrOptions
      ? actionOrOptions.default
      : params?.default

    const common: { path: string[]; options: T } = {
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
      const cmd = {
        name: nameOrAction,
        action: actionOrOptions,
        ...common,
      } as Command<T>
      if (isDefault) this.#defaultCommand = cmd
      else this.commands.push(cmd)
    } else {
      const cmd = {
        name: '',
        action: nameOrAction,
        ...common,
      } as Command<T>
      if (isDefault) this.#defaultCommand = cmd
      else this.commands.push(cmd)
    }

    return this
  }

  #find(
    args: string[],
  ): Command[] {
    return this.commands.filter((command) => {
      if (args.length === 0) return command.name === ''
      else {
        return command.path.length !== 0 &&
          command.path.every((item) => args.includes(item))
      }
    })
  }

  handle(args = Deno.args): void {
    if (args.length === 0 && !this.prefix) {
      if (this.#defaultCommand) {
        const { positionals, parsed } = handleArgParsing(
          this.#defaultCommand,
          args,
          this.#parseOptions,
        )

        return handleActionWithHelp(this.#defaultCommand, positionals, parsed)
      } else return console.log(this.createHelpMessage())
    }

    if (
      isAnonymousCommand(
        args,
        // @ts-ignore idk
        [...this.commands, ...this.programs].filter((x) =>
          typeof x.name === 'string'
        ).map((x) => x.name),
      )
    ) {
      const cmd = findExactCommand(
        this.#defaultCommand
          ? [...this.#find([]), this.#defaultCommand]
          : this.#find([]),
        args,
      )

      if (!cmd) throw new Error('Command not found')

      const { positionals, parsed } = handleArgParsing(
        cmd,
        args,
        this.#parseOptions,
      )

      return handleActionWithHelp(
        cmd,
        positionals.slice(cmd.path.length),
        parsed,
      )
    }

    const fullPath = makeFullPath(this)

    const commands = this.#find([...fullPath, ...args])

    const program = this.programs.find((program) => args[0] === program.prefix)

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

      return handleActionWithHelp(
        cmd,
        positionals.slice(cmd.path.length),
        parsed,
      )
    } else throw new Error('Command not found')
  }
  program(prefix: string, program = new CLI({ name: prefix, prefix })) {
    program.prefix = prefix
    program.parent = this
    this.programs.push(program)
    return program
  }
  createVersionMessage(
    version = '0.0.0',
    misc = '',
  ) {
    return this.name
      ? `${this.name}: ${version}${misc}`
      : `Clif: ${version}${misc}`
  }
  version(version = '0.0.0', misc = '') {
    this.command(() => {
      const parent = findDeepestParent(this)
      if (parent.prefix !== this.prefix) {
        console.log(parent.createVersionMessage(version, misc))
      } else console.log(this.createVersionMessage(version, misc))
    }, {
      options: [{
        name: 'version',
        aliases: ['v'],
        type: 'boolean',
        description: 'shows current version',
      }],
    })
  }
  createHelpMessage() {
    const defaultCommands = this.commands.filter((cmd) => cmd.name === '')

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
      this.commands.filter((c) => c.name !== '').length ? `\n\nCommands:` : ''
    }\n`

    const appendCommands = (commands: Command[]) => {
      commands.forEach((command) => {
        if (command.name) helpMessage += `  ${command.name}\n`
      })
    }

    appendCommands(this.commands)

    const appendPrograms = (programs: CLI[]) => {
      programs.forEach((program) => {
        helpMessage += `\nCommands for ${getParentName(program)}:\n`
        appendCommands(program.commands)
        appendPrograms(program.programs)
      })
    }
    if (!this.prefix || this.parent) {
      appendPrograms(this.programs)
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
      console.log(this.createHelpMessage())
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

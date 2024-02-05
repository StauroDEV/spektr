import { type ParseArgsConfig } from 'node:util'
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
  #parseOptions?: ParseArgsConfig
  helpFn?: (cmd: Command) => string
  constructor(
    opts:
      & { name?: string; prefix?: string; plugins?: ((cli: CLI) => void)[] }
      & ParseArgsConfig = {},
  ) {
    const { name, prefix, plugins, ...parseOptions } = opts
    this.name = name
    this.prefix = prefix
    this.#parseOptions = parseOptions

    // Apply all plugins
    for (const plugin of plugins || []) {
      plugin(this)
    }
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
      options: options.find((x) => x.name === 'help') ? options : [...options, {
        name: 'help',
        short: 'h',
        description: 'shows this message',
        type: 'boolean',
      }] as unknown as T,
    }

    if (typeof nameOrAction === 'string') {
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

  handle(args: string[]): void {
    if (args.length === 0 && !this.prefix) {
      if (this.#defaultCommand) {
        const { positionals, parsed } = handleArgParsing(
          this.#defaultCommand,
          args,
          this.#parseOptions,
        )

        return handleActionWithHelp({
          cmd: this.#defaultCommand,
          positionals,
          options: parsed,
          helpFn: this.helpFn,
        })
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
          ? [...this.commands, this.#defaultCommand]
          : this.commands,
        args,
      )

      if (!cmd) throw new Error('Command not found')

      const { positionals, parsed } = handleArgParsing(
        cmd,
        args,
        this.#parseOptions,
      )

      return handleActionWithHelp({
        cmd,
        positionals: positionals.slice(cmd.path.length),
        options: parsed,
        helpFn: this.helpFn,
      })
    }

    const fullPath = makeFullPath(this)

    const cmd = findExactCommand(this.commands, [...fullPath, ...args])

    const program = this.programs.find((program) => args[0] === program.prefix)

    if (program) {
      return program.handle(args.slice(1))
    } else if (cmd) {
      const { positionals, parsed } = handleArgParsing(
        cmd,
        args,
        this.#parseOptions,
      )

      return handleActionWithHelp({
        cmd,
        positionals: positionals.slice(cmd.path.length),
        options: parsed,
        helpFn: this.helpFn,
      })
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
        short: 'v',
        type: 'boolean',
        description: 'shows current version',
      }],
    })
  }
  createHelpMessage() {
    const defaultCommands = this.commands.filter((cmd) => cmd.name === '')

    const defaultCommandOptions = defaultCommands.map((cmd) => cmd.options).map(
      (options) =>
        options.map((opt) => opt.short ? `-${opt.short}` : `--${opt.name}`),
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
      commands.forEach((cmd) => {
        if (cmd.name) helpMessage += `  ${cmd.name}\n`
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
      defaultCommands.forEach((cmd) =>
        cmd.options.forEach((option) => {
          layout.push([
            [
              `--${option.name}`,
              `-${option.short}`,
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
        short: 'h',
        type: 'boolean',
        description: 'shows this message',
      }],
    })
  }
}

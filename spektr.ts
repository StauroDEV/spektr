import { type ParseArgsConfig } from 'node:util'
import { Action, Command, Option, Params } from './types.ts'
import { handleArgParsing } from './parse.ts'
import {
  findDeepestParent,
  findExactCommand,
  handleActionWithHelp,
  isAnonymousCommand,
  makeFullPath,
} from './utils.ts'
import { getBorderCharacters, table } from './deps.ts'
import { Plugin } from './types.ts'

/**
 * Skeptr CLI app class.
 */
export class CLI {
  /** CLI name */
  name?: string
  /**
   * CLI Prefix, for example `auth`
   */
  prefix?: string
  parent?: CLI
  commands: Command[] = []
  #defaultCommand?: Command
  programs: CLI[] = []
  #parseOptions?: ParseArgsConfig
  helpFn?: (cmd: Command) => string
  plugins: Plugin[] = []
  constructor(
    opts:
      & {
        name?: string
        prefix?: string
        plugins?: Plugin[]
        helpFn?: (cmd: Command) => string
      }
      & ParseArgsConfig = {},
  ) {
    const { name, prefix, plugins, helpFn, ...parseOptions } = opts
    this.name = name
    this.prefix = prefix
    this.#parseOptions = parseOptions
    this.helpFn = helpFn

    if (plugins) {
      this.plugins = plugins
      for (const plugin of plugins) {
        const { helpMessage, helpFn } = plugin(Object.freeze({ ...this }))
        this.helpMessage = helpMessage
        this.helpFn = helpFn
      }
    }
  }
  command<T extends readonly Option[] = readonly Option[]>(
    name: string,
    action: Action<T>,
    params?: Params<T>,
  ): Command

  command<T extends readonly Option[] = readonly Option[]>(
    name: string,
    action: Action<T>,
  ): Command

  command<T extends readonly Option[] = readonly Option[]>(
    action: Action<T>,
    params?: Params<T>,
  ): Command

  /**
   * Define a command for a CLI app.
   * @param nameOrAction command name or command action
   * @param actionOrOptions command action or command options list
   * @param params options and additional params
   * @returns the CLI app instance
   */
  command<T extends readonly Option[] = readonly Option[]>(
    nameOrAction: string | Action<T>,
    actionOrOptions?: Action<T> | Params<T>,
    params?: Params<T>,
  ): Command {
    const options =
      (actionOrOptions && 'options' in actionOrOptions
        ? actionOrOptions.options
        : params?.options) || [] as unknown as T

    const isDefault = actionOrOptions && 'default' in actionOrOptions
      ? actionOrOptions.default
      : params?.default

    const hasHelpOrVersion = typeof nameOrAction !== 'string' &&
      (
        Boolean(options.find((x) => x.name === 'version' || x.name === 'help'))
      )

    const common: {
      path: string[]
      options: T
      _builtin: boolean
      description?: string
      default?: boolean
    } = {
      path: makeFullPath(
        this,
        typeof nameOrAction === 'string' ? [nameOrAction] : undefined,
      ),
      options: hasHelpOrVersion ? options : [...options, {
        name: 'help',
        short: 'h',
        description: 'shows this message',
        type: 'boolean',
      }] as unknown as T,
      _builtin: typeof nameOrAction !== 'string' && hasHelpOrVersion,
      description: params?.description,
      default: isDefault,
    }

    const cmd = typeof nameOrAction === 'string'
      ? {
        name: nameOrAction,
        action: actionOrOptions as Action<T>,
        ...common,
      }
      : {
        name: '',
        action: nameOrAction,
        ...common,
      }
    if (isDefault) this.#defaultCommand = cmd
    this.commands.push(cmd)

    return cmd
  }

  /**
   * Handle commands with the given arguments. For Deno use `Deno.args`, for Node.js and Bun use `process.argv`
   * @param args
   */
  handle(args: string[]): void {
    if (args.length === 0) {
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
      } else return console.log(this.helpMessage())
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

    const fullPath = makeFullPath(this, args)

    const cmd = findExactCommand(this.commands, [...fullPath, ...args])

    const program = this.programs.find((program) => args[0] === program.prefix)

    const defaultCommand = this.commands.find((c) => c.default)

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
    } else if (defaultCommand) {
      const { positionals, parsed } = handleArgParsing(
        defaultCommand,
        args,
        this.#parseOptions,
      )
      return handleActionWithHelp({
        cmd: defaultCommand,
        positionals: positionals.slice(defaultCommand.path.length),
        options: parsed,
        helpFn: this.helpFn,
      })
    } else throw new Error('Command not found')
  }
  /**
   * Create a program, aka sub-command. It will handle all commands starting with a specified prefix
   * @param prefix command prefix, for example `auth`
   * @param program "program" (CLI app) instance that will handle on a specified prefix (optional)
   */
  program(
    prefix: string,
    program = new CLI({ name: prefix, prefix, plugins: this.plugins }),
  ) {
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
      : `Spektr: ${version}${misc}`
  }
  /**
   * Display a version when invoking `--version`
   * @param version version string
   * @param misc additional information
   */
  version(version?: string, misc = '') {
    this.command(() => {
      const parent = findDeepestParent(this)
      if (parent.prefix !== this.prefix && !version) {
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
  helpMessage() {
    const defaultCommands = this.commands.filter((cmd) => cmd.name === '')

    const defaultCommandOptions = defaultCommands.map((cmd) => cmd.options).map(
      (options) =>
        options.map((opt) => opt.short ? `-${opt.short}` : `--${opt.name}`),
    ).map((fmt) => `[${fmt}]`).join(' ')

    const getParentName = (cli: CLI | null): string => {
      if (cli?.parent) {
        return `${getParentName(cli.parent)} ${cli.name || cli.prefix}`
      } else {
        return cli?.name || cli?.prefix || ''
      }
    }

    let helpMessage = `Usage: ${
      getParentName(this)
    } [command] ${defaultCommandOptions}${
      this.commands.filter((c) => c.name !== '').length ? `\n\nCommands:` : ''
    }\n`

    const appendCommands = (commands: Command[]) => {
      const layout: string[][] = []
      commands.forEach((cmd) => {
        if (cmd.name) layout.push([cmd.name, cmd.description || ''])
      })
      if (layout.length) {
        helpMessage += table(layout, {
          border: getBorderCharacters('void'),
          columnDefault: {
            paddingLeft: 4,
          },
          drawHorizontalLine: () => false,
        })
      }
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
  /**
   * Add a help command when invoking `--help`
   */
  help() {
    this.command(() => {
      console.log(this.helpMessage())
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

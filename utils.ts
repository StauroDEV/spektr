import { getBorderCharacters, table } from './deps.ts'
import type { CLI } from './spektr.ts'
import type { Command, Option, ParsedOptions, Positionals } from './types.ts'

export const hasOptions = (args: Positionals): boolean =>
  !!args.find((arg) =>
    typeof arg === 'string' && (arg.startsWith(`--`) || arg.startsWith(`-`)) &&
    arg !== '--' && arg !== '-'
  )

export const isAnonymousCommand = (args: string[], names: string[]) => {
  return hasOptions(args) && !names.some((name) => args.includes(name))
}

export function makeFullPath(cli: CLI, path: string[] = []): string[] {
  if (cli.parent) {
    return makeFullPath(cli.parent, path)
  } else {
    return path
  }
}

export function findDeepestParent(cli: CLI): CLI {
  if (cli.parent) {
    return findDeepestParent(cli.parent)
  } else {
    return cli
  }
}

export function findExactCommand(commands: Command[], args: string[]) {
  // Split args into positionals and options
  const positionals = args.filter((arg) => !arg.startsWith('-'))
  const options = args.filter((arg) => arg.startsWith('-')).map((arg) =>
    arg.split('=')[0]
  )

  // Filter commands that have the path present in args in the correct order
  const pathMatchCommands = commands.filter((command) =>
    positionals.length === 0 && command.default
      ? command
      : command.path.every((pathPart, index) => positionals[index] === pathPart)
  )

  if (pathMatchCommands.length > 0) {
    const optionMatchCommands = pathMatchCommands.filter((command) =>
      command.options.some((option) =>
        options.includes(`--${option.name}`) ||
        options.includes(`-${option.short}`)
      )
    )

    if (optionMatchCommands.length > 0) return optionMatchCommands[0]

    if (!pathMatchCommands[0]._builtin) return pathMatchCommands[0]
  }

  return undefined
}

export const helpMessageForCommand = <
  P extends Positionals = Positionals,
  T extends readonly Option[] = readonly Option[],
>(cmd: Command<P, T>) => {
  const layout: string[][] = []
  let msg = `Usage: ${cmd.name} [args]\n`
  cmd.options.forEach((option) => {
    layout.push([
      option.short
        ? [
          `--${option.name}`,
          `-${option.short}`,
        ].join(', ')
        : `--${option.name}`,
      option.description || '',
    ])
  })

  if (layout.length !== 0) {
    msg += table(layout, {
      border: getBorderCharacters('void'),
      columnDefault: {
        paddingLeft: 4,
      },
      drawHorizontalLine: () => false,
    })
  }

  return msg
}

export const handleActionWithHelp = <
  P extends Positionals = Positionals,
  T extends readonly Option[] = readonly Option[],
>(
  { cmd, positionals, options, helpFn = helpMessageForCommand }: {
    cmd: Command<P, T>
    positionals: P
    options: ParsedOptions<T>
    helpFn?: (cmd: Command<P, T>) => string
  },
) => {
  if (cmd.name !== '' && ('help' in options || 'h' in options)) {
    return console.log(helpFn(cmd))
  } else return cmd.action(positionals, options)
}

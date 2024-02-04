import { getBorderCharacters, table } from 'https://esm.sh/table@6.8.1'
import { CLI } from './clif.ts'
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
  if (cli.prefix !== undefined) {
    path.unshift(cli.prefix)
  }
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
    command.path.every((pathPart, index) => positionals[index] === pathPart)
  )

  if (pathMatchCommands.length > 0) {
    const optionMatchCommands = pathMatchCommands.filter((command) =>
      command.options.some((option) =>
        options.includes(`--${option.name}`) ||
        option.aliases.some((alias) => options.includes(`-${alias}`))
      )
    )

    if (optionMatchCommands.length > 0) return optionMatchCommands[0]

    return pathMatchCommands[0]
  }

  return undefined
}

export const helpMessageForCommand = <
  T extends readonly Option[] = readonly Option[],
>(cmd: Command<T>) => {
  const layout: string[][] = []
  let msg = `Usage: ${cmd.name} [args]\n`
  cmd.options.forEach((option) => {
    layout.push([
      [
        `--${option.name}`,
        ...(option.aliases.map((a) => `-${a}`)),
      ].join(', '),
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
  T extends readonly Option[] = readonly Option[],
>(
  { cmd, positionals, options, helpFn = helpMessageForCommand }: {
    cmd: Command<T>
    positionals: Positionals
    options: ParsedOptions<T>
    helpFn?: (cmd: Command<T>) => string
  },
) => {
  if (cmd.name !== '' && ('help' in options || 'h' in options)) {
    return console.log(helpFn(cmd))
  } else return cmd.action(positionals, options)
}

import { CLI } from './clif.ts'
import { Command } from './types.ts'

export const hasOptions = (args: string[]): boolean =>
  !!args.find((arg) =>
    (arg.startsWith(`--`) || arg.startsWith(`-`)) && arg !== '--' && arg !== '-'
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
  return commands.length > 1 && hasOptions(args)
    ? commands.find((c) =>
      c.options.find((o) =>
        args.find((arg) => arg.startsWith(`--${o.name}`)) ||
        (o.aliases || []).find((a) =>
          args.find((arg) =>
            arg.slice(0, 2) === `-${a}` &&
            (arg[2] === '' || arg[2] === undefined)
          )
        )
      )
    )
    : commands.sort((x, y) => y.path.length - x.path.length)[0]
}

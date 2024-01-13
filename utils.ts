import { CLI } from './clif.ts'
import { Command } from './types.ts'

export const hasOptions = (args: string[]) =>
  args.find((arg) =>
    (arg.startsWith(`--`) || arg.startsWith(`-`)) && arg !== '--' && arg !== '-'
  )

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

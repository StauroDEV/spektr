import { colors, getBorderCharacters, table } from '../deps.ts'
import type { CLI } from '../spektr.ts'
import { Command, Option, Plugin } from '../types.ts'

export const colorPlugin: Plugin = (cli) => {
  const helpFn = <
    T extends readonly Option[] = readonly Option[],
  >(cmd: Command<T>) => {
    const layout: string[][] = []
    let msg = `${colors.bold('Usage')}: ${cmd.name} [args]\n`
    cmd.options.forEach((option) => {
      layout.push([
        colors.cyan([
          `--${option.name}`,
          `-${option.short}`,
        ].join(', ')),
        colors.gray(option.description || ''),
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
  const helpMessage = () => {
    const defaultCommands = cli.commands.filter((cmd) => cmd.name === '')

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

    let helpMessage = `${colors.bold('Usage')}: ${
      getParentName(cli)
    } [command] ${defaultCommandOptions}${
      cli.commands.filter((c) => c.name !== '').length
        ? `\n\n${colors.bold('Commands')}:`
        : ''
    }\n`

    const appendCommands = (commands: Command[]) => {
      const layout: string[][] = []
      commands.forEach((cmd) => {
        if (cmd.name) {
          layout.push([cmd.name, colors.gray(cmd.description || '')])
        }
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

    appendCommands(cli.commands)

    const appendPrograms = (programs: CLI[]) => {
      programs.forEach((program) => {
        helpMessage += `\n${
          colors.bold(`Commands for ${getParentName(program)}`)
        }:\n`
        appendCommands(program.commands)
        appendPrograms(program.programs)
      })
    }
    if (!cli.prefix || cli.parent) {
      appendPrograms(cli.programs)
    }
    if (defaultCommands.length !== 0) {
      helpMessage += `\n${colors.bold('Options')}:\n`
      const layout: string[][] = []
      defaultCommands.forEach((cmd) =>
        cmd.options.forEach((option) => {
          layout.push([
            colors.cyan(
              option.short
                ? [
                  `--${option.name}`,
                  `-${option.short}`,
                ].join(', ')
                : `--${option.name}`,
            ),
            colors.gray(option.description || ''),
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

  return { helpMessage, helpFn }
}

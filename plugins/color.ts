import * as colors from 'https://deno.land/std@0.212.0/fmt/colors.ts'
import { CLI } from '../spektr.ts'
import { getBorderCharacters, table } from 'https://esm.sh/table@6.8.1'
import { Command } from '../types.ts'

export const withColorPlugin = (cli: CLI) => {
  cli.createVersionMessage = (
    version = '0.0.0',
    misc?,
    customColor: keyof typeof colors = 'cyan',
  ) => {
    const colorFn = colors[customColor] as (str: string) => string
    return cli.name
      ? `${colorFn(cli.name)}: ${version}${misc}`
      : `${colorFn('Spektr')}: ${version}${misc}`
  }
  cli.createHelpMessage = () => {
    const defaultCommands = cli.commands.filter((cmd) => cmd.name === '')

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

    let helpMessage = `${colors.bold('Usage')}: ${
      getParentName(cli)
    } [command] ${defaultCommandOptions}${
      cli.commands.filter((c) => c.name !== '').length
        ? `\n\n${colors.bold('Commands')}:`
        : ''
    }\n`

    const appendCommands = (commands: Command[]) => {
      commands.forEach((cmd) => {
        if (cmd.name) helpMessage += `  ${cmd.name}\n`
      })
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
            colors.cyan([
              `--${option.name}`,
              `-${option.short}`,
            ].join(', ')),
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
  cli.helpFn = (cmd: Command) => {
    const layout: string[][] = []
    let msg = `${colors.bold('Usage')}: ${cmd.name} [args]\n`
    cmd.options.forEach((option) => {
      layout.push([
        colors.cyan([
          `--${option.name}`,
          `-${option.short}`,
        ].join(', ')),
        option.description || '',
      ])
    })

    msg += table(layout, {
      border: getBorderCharacters('void'),
      columnDefault: {
        paddingLeft: 4,
      },
      drawHorizontalLine: () => false,
    })

    return msg
  }

  return cli
}

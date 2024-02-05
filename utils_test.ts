import { describe, it } from 'https://deno.land/std@0.212.0/testing/bdd.ts'
import { expect } from 'https://deno.land/std@0.212.0/expect/mod.ts'
import {
  findDeepestParent,
  findExactCommand,
  hasOptions,
  helpMessageForCommand,
} from './utils.ts'
import { CLI } from './clif.ts'
import { Command } from './types.ts'

describe('hasOptions', () => {
  it('detects regular args', () => {
    expect(hasOptions(['--test'])).toEqual(true)
  })
  it('detects short', () => {
    expect(hasOptions(['-t'])).toEqual(true)
  })
  it('detects arg with value', () => {
    expect(hasOptions(['--test=123'])).toEqual(true)
  })
  it('detects multiple args', () => {
    expect(hasOptions(['--test', '--test2'])).toEqual(true)
  })
  it('returns false if no args are detected', () => {
    expect(hasOptions(['test'])).toEqual(false)
  })
  it('returns false on "--" string', () => {
    expect(hasOptions(['--'])).toEqual(false)
  })
})

describe('findExactCommand', () => {
  it('returns the command with the matching option if there are multiple commands and args', () => {
    const commands: Command[] = [
      {
        name: 'test',
        path: ['test'],
        action: () => {},
        options: [{ name: 'opt1', short: 'o', type: 'boolean' }],
      },
      {
        name: 'test2',
        path: ['test'],
        action: () => {},
        options: [{ name: 'opt2', short: 'e', type: 'boolean' }],
      },
    ]

    const command = findExactCommand(commands, ['test', '--opt2'])

    expect(command?.name).toEqual('test2')
  })

  it('returns the command with the matching short if there are multiple commands and args', () => {
    const commands: Command[] = [
      {
        name: 'test1',
        path: ['test'],
        action: () => {},
        options: [{ name: 'opt1', short: 'o', type: 'boolean' }],
      },
      {
        name: 'test2',
        path: ['test'],
        action: () => {},
        options: [{ name: 'opt2', short: 'e', type: 'boolean' }],
      },
    ]

    const command = findExactCommand(commands, ['test', '-o'])

    expect(command?.name).toEqual('test1')
  })

  it('returns the first command with the same options if there are multiple commands and args', () => {
    const commands: Command[] = [
      {
        name: 'test1',
        path: ['test'],
        action: () => {},
        options: [{ name: 'opt1', short: 'o', type: 'boolean' }],
      },
      {
        name: 'test2',
        path: ['test'],
        action: () => {},
        options: [{ name: 'opt1', short: 'o', type: 'boolean' }],
      },
    ]

    const command = findExactCommand(commands, ['test', '--opt1'])

    expect(command?.name).toEqual('test1')
  })

  it('returns undefined if there are no commands', () => {
    const commands: Command[] = []
    const args = ['--opt1']

    const command = findExactCommand(commands, args)

    expect(command).toBeUndefined()
  })
})

describe('helpMessageForCommand', () => {
  it('outputs help message for a command', () => {
    const cli = new CLI({ name: 'cli' })

    cli.command('test', () => {}, {
      options: [{
        name: 'test',
        short: 't',
        type: 'boolean',
        description: 'testing',
      }],
    })

    const message = helpMessageForCommand(cli.commands[0])

    expect(message).toEqual(
      `Usage: test [args]\n    --test, -t     testing            \n    --help, -h     shows this message \n`,
    )
  })
  it('outputs help message for a command with no options', () => {
    const cli = new CLI({ name: 'cli' })

    cli.command('test', () => {})

    const message = helpMessageForCommand(cli.commands[0])

    expect(message).toEqual(
      'Usage: test [args]\n    --help, -h     shows this message \n',
    )
  })
  it('outputs help message for a command with no description', () => {
    const cli = new CLI({ name: 'cli' })

    cli.command('test', () => {}, {
      options: [{ name: 'test', type: 'boolean', short: 't' }],
    })

    const message = helpMessageForCommand(cli.commands[0])

    expect(message).toEqual(
      'Usage: test [args]\n' + '    --test, -t                        \n' +
        '    --help, -h     shows this message \n',
    )
  })
})

describe('findDeepestParent', () => {
  it('returns a cli if it has no parent', () => {
    const cli = new CLI({ name: 'cli' })

    expect(findDeepestParent(cli)).toEqual(cli)
  })
  it('returns a parent cli if it has a parent', () => {
    const cli = new CLI({ name: 'cli' })

    const child = cli.program('child')

    expect(findDeepestParent(child)).toEqual(cli)
  })
  it('returns the deepest cli if it has multiple parents', () => {
    const cli = new CLI({ name: 'cli' })

    const child = cli.program('child')

    const grandchild = child.program('grandchild')

    expect(findDeepestParent(grandchild)).toEqual(cli)
  })
})

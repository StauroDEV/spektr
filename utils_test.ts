import { describe, it } from 'https://deno.land/std@0.212.0/testing/bdd.ts'
import { expect } from 'https://deno.land/std@0.212.0/expect/mod.ts'
import {
  findDeepestParent,
  findExactCommand,
  hasOptions,
  helpMessageForCommand,
} from './utils.ts'
import { CLI } from './clif.ts'

describe('hasOptions', () => {
  it('detects regular args', () => {
    expect(hasOptions(['--test'])).toEqual(true)
  })
  it('detects alias', () => {
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
  it('finds command by its name', () => {
    const cli = new CLI({ name: 'cli' })

    cli.command('test', () => {})

    const command = findExactCommand(cli.commands, ['test'])

    expect(command).toEqual(cli.commands[0])
  })
  it('finds command by alias', () => {
    const cli = new CLI({ name: 'cli' })

    cli.command('test', () => {}, {
      options: [{ name: 'test', aliases: ['t'], type: 'boolean' }],
    })

    const command = findExactCommand(cli.commands, ['t'])

    expect(command).toEqual(cli.commands[0])
  })
  it('finds the more precise command if two with the same name are defined', () => {
    const cli = new CLI({ name: 'cli' })

    cli.command('test', () => {})

    cli.command('test', () => {}, {
      options: [{ name: 'test', aliases: ['t'], type: 'boolean' }],
    })

    const command = findExactCommand(cli.commands, ['-t'])

    expect(command?.options[0].name).toEqual('test')
  })
})

describe('helpMessageForCommand', () => {
  it('outputs help message for a command', () => {
    const cli = new CLI({ name: 'cli' })

    cli.command('test', () => {}, {
      options: [{
        name: 'test',
        aliases: ['t'],
        type: 'boolean',
        description: 'testing',
      }],
    })

    const message = helpMessageForCommand(cli.commands[0])

    expect(message).toEqual(
      `Usage: test [args]\n    --test, -t     testing \n`,
    )
  })
  it('outputs help message for a command with no options', () => {
    const cli = new CLI({ name: 'cli' })

    cli.command('test', () => {})

    const message = helpMessageForCommand(cli.commands[0])

    expect(message).toEqual('Usage: test [args]\n')
  })
  it('outputs help message for a command with no description', () => {
    const cli = new CLI({ name: 'cli' })

    cli.command('test', () => {}, {
      options: [{ name: 'test', type: 'boolean', aliases: ['t'] }],
    })

    const message = helpMessageForCommand(cli.commands[0])

    expect(message).toEqual('Usage: test [args]\n    --test, -t      \n')
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

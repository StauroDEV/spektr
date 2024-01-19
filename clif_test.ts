import { describe, it } from 'https://deno.land/std@0.212.0/testing/bdd.ts'
import { expect } from 'https://deno.land/std@0.212.0/expect/mod.ts'
import {
  assertSpyCall,
  spy,
} from 'https://deno.land/std@0.212.0/testing/mock.ts'
import { CLI } from './clif.ts'
import { Positionals } from './types.ts'
import { ParsedOptions } from './types.ts'

describe('CLI', () => {
  it('is initialized properly', () => {
    const cli = new CLI({ name: 'cli' })

    expect(cli.name).toEqual('cli')
    expect(cli.prefix).toEqual(undefined)
  })
  describe('commands', () => {
    it('matching command is handled', () => {
      const cli = new CLI({ name: 'cli' })

      const action = () => {
        return 'hello world'
      }

      const actionSpy = spy(action)

      cli.command('test', actionSpy)

      cli.handle(['test'])

      assertSpyCall(actionSpy, 0, {
        returned: 'hello world',
      })
    })
    it('args and positionals are passed to the action', () => {
      const cli = new CLI({ name: 'cli' })

      const options = [{
        name: 'value',
        aliases: ['v'],
        type: 'string',
      }] as const

      const actionSpy = spy(
        (pos: Positionals, args: ParsedOptions<typeof options>) => {
          return `${pos[0]}: ${JSON.stringify(args)}`
        },
      )

      cli.command<typeof options>('test', actionSpy, { options })

      cli.handle(['--value=str', 'test', 'pos'])

      assertSpyCall(actionSpy, 0, {
        args: [['pos'], { value: 'str', v: 'str' }],
        returned: 'pos: {"value":"str","v":"str"}',
      })
    })
    it('basic nesting works', () => {
      const cli = new CLI()

      const deploy = cli.program('deploy')

      const actionSpy = spy((_pos: Positionals) => {
        return 'deploy start'
      })

      deploy.command('start', actionSpy)

      cli.handle(['deploy', 'start'])

      assertSpyCall(actionSpy, 0, {
        args: [[], {}],
        returned: 'deploy start',
      })
    })
    it('deep nesting also works', () => {
      const cli = new CLI()

      const deploy = cli.program('deploy')

      const manage = deploy.program('manage')

      const actionSpy = spy((_pos: Positionals) => {
        return 'deploy manage start'
      })

      manage.command('start', actionSpy)

      cli.handle(['deploy', 'manage', 'start'])

      assertSpyCall(actionSpy, 0, {
        args: [[], {}],
        returned: 'deploy manage start',
      })
    })
    it('help message is returned if no default command was defined', () => {
      const cli = new CLI()

      cli.command('test', () => {})

      const originalConsoleLog = console.log

      const consoleSpy = spy(originalConsoleLog)

      console.log = consoleSpy

      cli.handle([])

      assertSpyCall(consoleSpy, 0, {
        args: ['Usage:  [command] \n\nCommands:\n  test\n'],
      })

      console.log = originalConsoleLog
    })
    it('default command is used if no command is passed', () => {
      const cli = new CLI()

      const actionSpy = spy(() => `Default command`)

      cli.command('test', actionSpy, { default: true })

      cli.handle([])

      assertSpyCall(actionSpy, 0, {
        returned: 'Default command',
      })
    })
  })
})

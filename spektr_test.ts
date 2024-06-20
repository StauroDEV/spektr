import {
  afterEach,
  beforeEach,
  describe,
  it,
} from 'https://deno.land/std@0.224.0/testing/bdd.ts'
import { expect } from 'https://deno.land/std@0.224.0/expect/mod.ts'
import {
  assertSpyCall,
  Spy,
  spy,
} from 'https://deno.land/std@0.224.0/testing/mock.ts'
import { CLI } from './spektr.ts'
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
        short: 'v',
        type: 'string',
      }] as const

      const actionSpy = spy(
        (pos: Positionals, args: ParsedOptions<typeof options>) => {
          return `${pos[0]}: ${JSON.stringify(args)}`
        },
      )

      cli.command('test', actionSpy, { options })

      cli.handle(['test', 'pos', '--value=str'])

      assertSpyCall(actionSpy, 0, {
        args: [['pos'], { value: 'str' }],
        returned: 'pos: {"value":"str"}',
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
    it('default command is used if no command is passed', () => {
      const cli = new CLI()

      const actionSpy = spy(() => `Default command`)

      cli.command('test', actionSpy, { default: true })

      cli.handle([])

      assertSpyCall(actionSpy, 0, {
        returned: 'Default command',
      })
    })
    it('default command without name is used if no command is passed', () => {
      const cli = new CLI()

      const actionSpy = spy(() => `Default command`)

      cli.command(actionSpy, { default: true })

      cli.handle([])

      assertSpyCall(actionSpy, 0, {
        returned: 'Default command',
      })
    })
    it('throws if command is not found', () => {
      const cli = new CLI()

      cli.command('test', () => `test`)

      expect(() => cli.handle(['test2'])).toThrow('Command not found')
    })
    it('throws if trying to use a default command which is not defined', () => {
      const cli = new CLI()

      expect(() => cli.handle(['default', '--arg'])).toThrow(
        'Command not found',
      )
    })
  })
  describe('cli.help()', () => {
    const originalConsoleLog = console.log
    let consoleSpy: Spy<typeof console['log']>

    beforeEach(() => {
      consoleSpy = spy(originalConsoleLog)
      console.log = consoleSpy
    })
    afterEach(() => {
      console.log = originalConsoleLog
    })
    it('help message is returned if no default command was defined', () => {
      const cli = new CLI()

      cli.command('test', () => {})

      cli.handle([])

      assertSpyCall(consoleSpy, 0, {
        args: ['Usage:  [command] \n\nCommands:\n    test      \n'],
      })
    })
    it('prints out help for defined commands', () => {
      const cli = new CLI({ name: 'player' })

      cli.command('run', () => 'Run', {
        options: [{
          name: 'speed',
          short: 's',
          type: 'string',
          description: 'speed in km/h',
        }],
      })

      cli.help()

      cli.handle(['--help'])

      assertSpyCall(consoleSpy, 0, {
        args: [
          'Usage: player [command] [-h]\n' +
          '\n' +
          'Commands:\n' +
          '    run      \n' +
          '\n' +
          'Options:\n' +
          '    --help, -h     shows this message \n',
        ],
      })

      cli.handle(['run', '--help'])

      assertSpyCall(consoleSpy, 1, {
        args: [
          'Usage: run [args]\n' +
          '    --speed, -s     speed in km/h      \n' +
          '    --help, -h      shows this message \n',
        ],
      })
    })
    it('prints out help for defined programs', () => {
      const cli = new CLI({ name: 'player' })

      const run = cli.program('knight')

      run.command('fight', () => 'Fight')

      cli.help()

      cli.handle(['--help'])

      assertSpyCall(consoleSpy, 0, {
        args: [
          'Usage: player [command] [-h]\n' +
          '\n' +
          'Commands for player knight:\n' +
          '    fight      \n' +
          '\n' +
          'Options:\n' +
          '    --help, -h     shows this message \n',
        ],
      })
    })
  })
  describe('cli.version()', () => {
    const originalConsoleLog = console.log
    let consoleSpy: Spy<typeof console['log']>
    beforeEach(() => {
      consoleSpy = spy(originalConsoleLog)
      console.log = consoleSpy
    })
    afterEach(() => {
      console.log = originalConsoleLog
    })
    it('version is 0.0.0 by default', () => {
      const cli = new CLI({ name: 'cli' })

      cli.version()

      cli.handle(['--version'])

      assertSpyCall(consoleSpy, 0, { args: ['cli: 0.0.0'] })
    })
    it('name is Spektr by default', () => {
      const cli = new CLI({})

      cli.version()

      cli.handle(['--version'])

      assertSpyCall(consoleSpy, 0, { args: ['Spektr: 0.0.0'] })
    })
    it('subcommand version() invokes its root parent version', () => {
      const cli = new CLI({ name: 'root' })

      const sub = new CLI({ name: 'sub' })

      cli.version()
      sub.version()

      cli.handle(['sub', '--version'])

      assertSpyCall(consoleSpy, 0, { args: ['root: 0.0.0'] })
    })
  })
})

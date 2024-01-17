import { describe, it } from 'https://deno.land/std@0.212.0/testing/bdd.ts'
import { expect } from 'https://deno.land/std@0.212.0/expect/mod.ts'
import { handleArgParsing } from './parse.ts'

describe('handleArgParsing', () => {
  it('parses command line arguments and positionals based on given options', () => {
    const { positionals, parsed } = handleArgParsing({
      options: [
        {
          name: 'test',
          type: 'string',
        },
      ],
    }, ['pos1', '--test=val', 'pos2'])

    expect(positionals).toEqual(['pos1', 'pos2'])
    expect(parsed).toEqual({ test: 'val' })
  })
  it('supports aliases and returns them as well', () => {
    const { parsed } = handleArgParsing({
      options: [
        {
          name: 'test',
          type: 'string',
          aliases: ['t'],
        },
      ],
    }, ['-t=val'])

    expect(parsed).toEqual({ test: 'val', t: 'val' })
  })
  it('throws on unknown arg', () => {
    try {
      handleArgParsing({
        options: [],
      }, ['-t=val'])
    } catch (e) {
      expect((e as Error).message).toEqual('Unknown argument: t')
    }
  })
  it('throws on invalid arg type', () => {
    try {
      handleArgParsing({
        options: [{ name: 'test', type: 'boolean' }],
      }, ['--test=val'])
    } catch (e) {
      expect((e as Error).message).toEqual(
        'Invalid argument type for test: expected boolean, got string',
      )
    }
  })
})

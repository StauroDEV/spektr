import { describe, it } from 'https://deno.land/std@0.221.0/testing/bdd.ts'
import { expect } from 'https://deno.land/std@0.221.0/expect/mod.ts'
import { handleArgParsing } from './parse.ts'

describe('handleArgParsing', () => {
  it('parses command line arguments and positionals based on given options', () => {
    expect(handleArgParsing({
      options: [
        {
          name: 'test',
          type: 'string',
        },
      ],
    }, ['pos1', '--test=val', 'pos2'])).toEqual({
      parsed: { test: 'val' },
      positionals: ['pos1', 'pos2'],
    })
  })
  it('supports aliases and returns them as well', () => {
    expect(handleArgParsing({
      options: [
        {
          name: 'test',
          type: 'string',
          short: 't',
        },
      ],
    }, ['-t', 'val'])).toEqual({
      parsed: { test: 'val' },
      positionals: [],
    })
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
      }, ['--test', 'val'])
    } catch (e) {
      expect((e as Error).message).toEqual(
        'Invalid argument type for test: expected boolean, got string',
      )
    }
  })
  it('throws if required arg is not present', () => {
    try {
      handleArgParsing({
        options: [{
          name: 'test',
          type: 'boolean',
          required: true,
        }],
      }, [])
    } catch (e) {
      expect((e as Error).message).toEqual(
        'Argument test is required',
      )
    }
  })
  it('does not throw for required if short is passed', () => {
    expect(handleArgParsing({
      options: [{
        name: 'test',
        type: 'boolean',
        required: true,
        short: 't',
      }],
    }, ['-t'])).toEqual({ parsed: { test: true }, positionals: [] })
  })
  it('throws if neither arg nor short was passed', () => {
    try {
      handleArgParsing({
        options: [{
          name: 'test',
          type: 'boolean',
          required: true,
          short: 't',
        }],
      }, [])
    } catch (e) {
      expect((e as Error).message).toEqual(
        'Argument test is required',
      )
    }
  })
})

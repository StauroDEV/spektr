import { describe, it } from 'https://deno.land/std@0.212.0/testing/bdd.ts'
import { expect } from 'https://deno.land/std@0.212.0/expect/mod.ts'
import { hasOptions } from './utils.ts'

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

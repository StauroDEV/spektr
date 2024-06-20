import { colorPlugin } from './plugins/color.ts'
import { CLI } from './spektr.ts'

const cli = new CLI({
  name: 'stauro',
  plugins: [colorPlugin],
})

cli.command('hello', (_, args) => {
  args.name ? console.log(`Hello ${args.name}!`) : console.log('Hello!')
}, {
  description: 'Display a hello message',
  options: [
    { name: 'name', description: 'your name', type: 'string', short: 'n' },
    { name: 'test', type: 'string' },
  ] as const,
})

const pg = cli.program('pg')

pg.command('hello', (_, args) => {
  args.name ? console.log(`Hello ${args.name}!`) : console.log('Hello!')
}, {
  options: [
    { name: 'name', description: 'your name', type: 'string', short: 'n' },
  ] as const,
})

pg.command<[string]>('pos', ([pos]) => {
  console.log(`This positional is typed: ${pos}`)
})

pg.version('1.2.3')

cli.version()

cli.help()

cli.handle(Deno.args)

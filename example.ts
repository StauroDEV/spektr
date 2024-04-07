import { CLI } from './spektr.ts'

const cli = new CLI({ name: 'stauro' })

cli.command('hello', (_, args) => {
  args.name ? console.log(`Hello ${args.name}!`) : console.log('Hello!')
}, {
  description: 'Display a hello message',
  options: [
    { name: 'name', description: 'your name', type: 'string', short: 'n' },
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

pg.version('1.2.3')

cli.version()

cli.help()

cli.handle(Deno.args)

import { CLI } from './clif.ts'
import { withColorPlugin } from './plugins/color.ts'

const cli = new CLI({ name: 'stauro', plugins: [withColorPlugin] })

cli.command('hello', (_, args) => {
  args.name ? console.log(`Hello ${args.name}!`) : console.log('Hello!')
}, {
  options: [
    { name: 'name', description: 'your name', type: 'string', aliases: ['n'] },
  ] as const,
})

const pg = cli.program('pg')

pg.version()

cli.version()

cli.help()

cli.handle()

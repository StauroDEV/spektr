import { CLI } from './clif.ts'

const cli = new CLI({ name: 'stauro' })

cli.command('hello', (_, args) => {
  args.name ? console.log(`Hello ${args.name}!`) : console.log('Hello!')
}, {
  options: [
    { name: 'name', description: 'your name', type: 'string', aliases: ['n'] },
  ] as const,
})

cli.handle()

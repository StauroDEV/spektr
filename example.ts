import { CLI } from './clif.ts'

const cli = new CLI({ name: 'stauro' })

cli.command((...args) => {
  console.log(args)
}, {
  options: [{
    name: 'test',
    aliases: ['t'],
    type: 'string',
    description: 'this is a test',
    required: true,
  }],
  default: true,
})

const auth = cli.program('auth')

auth.help()

auth.command('login', () => {
  console.log('Logging in...')
})

const user = auth.program('user')

user.help()

user.command('add', () => {
  console.log('Adding user...')
}, { options: [{ name: 'hey', aliases: ['h'], type: 'boolean' }] })

user.command('remove', () => {
  console.log('Removing user...')
})

cli.version()

cli.help()

cli.handle()

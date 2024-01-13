import { CLI } from './clif.ts'

const cli = new CLI()

const auth = cli.program('auth')

auth.command('login', () => {
  console.log('Logging in...')
})

const user = auth.program('user')

user.command('add', () => {
  console.log('Adding user...')
})

user.command('remove', () => {
  console.log('Removing user...')
})

cli.version()

cli.help()

cli.handle()

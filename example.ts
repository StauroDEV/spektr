import { CLI } from './clif.ts'

const cli = new CLI()

cli.command('root', () => {
  console.log('Hello')
})

const deploy = cli.program('deploy')

deploy.command('start', (_, options) => {
  console.log(_)
  if (options.environment) {
    console.log(`Deploying to environment: ${options.environment}`)
  }
}, {
  options: [
    {
      name: 'environment',
      aliases: ['e', 'env'],
      type: 'string',
    },
  ],
})

const auth = cli.program('auth')

auth.command('login', () => {
  console.log('Logging in...')
})

cli.version()

cli.help()

cli.handle()

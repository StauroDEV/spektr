import { Clif } from './clif.ts'

const cli = new Clif()

const deploy = new Clif()
cli.program('deploy', deploy)

deploy.command('start', (_, options) => {
  console.log('Starting deployment...')
  if (options.environment) {
    console.log(`Deploying to environment: ${options.environment}`)
  }
}, {
  options: [
    {
      name: 'environment',
      aliases: ['e'],
      type: 'string',
    },
  ],
})

const auth = new Clif()
cli.program('auth', auth)

auth.command('login', () => {
  console.log('Logging in...')
})

cli.version()

cli.help()

cli.handle()

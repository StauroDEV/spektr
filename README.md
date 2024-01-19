# Clif

middleware-based CLI framework.

## Example

```ts
import { Clif } from 'https://deno.land/x/clif.ts'

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
```

## Features

- Infinite nesting support for commands (aka `git remote add`)
- Default command support
- Automatic help/version, including individual commands and programs
- Argument validation
- Auto-complete for options
- Color plugin for colorful help/version messages

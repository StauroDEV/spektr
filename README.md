# Spektr

Elegant CLI framework. Works with Deno, Node.js and Bun.

## Features

- Infinite nesting for commands (aka `git remote add`)
- Default command support
- Automatic help/version, including individual commands and programs
- Argument validation
- Auto-complete for options
- Pluggable (color plugin out-of-the-box)

## Example

```ts
import { CLI } from 'https://deno.land/x/spektr/spektr.ts'
import { withColorPlugin } from 'https://deno.land/x/spektr/plugins/color.ts'

const cli = new CLI({ name: 'spektr', plugins: [withColorPlugin] })

cli.command('hello', (_, args) => {
  args.name ? console.log(`Hello ${args.name}!`) : console.log('Hello!')
}, {
  options: [
    { name: 'name', description: 'your name', type: 'string', short: ['n'] },
  ] as const,
})

cli.version()

cli.help()

cli.handle()
```

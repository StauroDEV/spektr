# Clif

middleware-based CLI framework.

## Example

```ts
import { Clif } from 'https://deno.land/x/clif.ts'

const git = new Clif({ name: 'git' })

const remote = new Clif()

remote.command({
  options: [
    {
      name: 'verbose',
      aliases: ['v'],
      type: 'boolean',
    },
  ],
}, ([name], options) => {
  console.log(`${name}: ${options.v ? 'verbose' : 'bleh'}`)
})

git.program('remote', remote)

git.parse()
```

## Features

- Infinite nesting support for commands (aka `git remote add`)
- Automatic help/version, including individual commands and programs
- Argument validation

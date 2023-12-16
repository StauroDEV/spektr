import { Clif } from './clif.ts'

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

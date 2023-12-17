import { Clif } from './clif.ts'

const git = new Clif({ name: 'git' })

const remote = new Clif()

remote.command({
  options: [
    {
      name: 'tiger',
      aliases: ['t', 'tgr'],
      type: 'string',
    },
  ],
}, (_, options) => {
  console.log(options)
})

remote.command({
  name: 'add',
}, () => {
  console.log(`git remote add`)
})

remote.command({
  options: [
    {
      name: 'bee',
      aliases: ['b'],
      type: 'string',
    },
  ],
}, ([name], options) => {
  console.log(name, options)
})

git.program('remote', remote)

git.version()

git.help()

git.handle()

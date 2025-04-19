// ex. scripts/build_npm.ts
import { build, emptyDir } from '@deno/dnt'

await emptyDir('./npm')

await build({
  packageManager: 'pnpm',
  entryPoints: ['./spektr.ts', './plugins/color.ts'],
  outDir: './npm',
  scriptModule: false,
  declaration: 'separate',
  shims: { deno: false },
  test: false,
  compilerOptions: {
    lib: ['DOM', 'ESNext'],
    target: 'Latest',
    skipLibCheck: true,
  },
  package: {
    name: 'spektr',
    version: Deno.args[0],
    description: 'Elegant CLI framework.',
    license: 'Apache-2.0',
    repository: {
      type: 'git',
      url: 'https://github.com/StauroDEV/spektr',
    },
    bugs: {
      url: 'https://github.com/stauroDEV/spektr/issues',
    },
    publishConfig: {
      access: 'public',
    },
    dependencies: {
      'picocolors': '^1.1.1',
      table: '^6.8.1',
    },
    devDependencies: {
      '@types/node': 'latest',
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync('LICENSE', 'npm/LICENSE')
    Deno.copyFileSync('README.md', 'npm/README.md')
  },
})

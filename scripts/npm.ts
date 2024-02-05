// ex. scripts/build_npm.ts
import { build, emptyDir } from 'https://deno.land/x/dnt@0.40.0/mod.ts'

await emptyDir('./npm')

await build({
  packageManager: 'pnpm',
  entryPoints: ['./clif.ts', './plugins/color.ts'],
  outDir: './npm',
  scriptModule: false,
  shims: { deno: false },
  test: false,
  compilerOptions: {
    lib: ['DOM', 'ESNext'],
    target: 'Latest',
    skipLibCheck: true,
  },
  package: {
    name: 'clif',
    version: Deno.args[0],
    description: 'Elegant CLI framework.',
    license: 'Apache-2.0',
    repository: {
      type: 'git',
      url: 'git+https://github.com/stauroDEV/clif.git',
    },
    bugs: {
      url: 'https://github.com/stauroDEV/clif/issues',
    },
    publishConfig: {
      access: 'public',
    },
    dependencies: {
      'colorette': '2.0.20',
    },
    devDependencies: {
      '@types/node': 'latest',
    },
  },
  mappings: {
    'https://deno.land/std@0.212.0/fmt/colors.ts': {
      name: 'colorette',
      version: '2.0.20',
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync('LICENSE', 'npm/LICENSE')
    Deno.copyFileSync('README.md', 'npm/README.md')
  },
})

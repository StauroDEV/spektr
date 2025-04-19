// ex. scripts/build_npm.ts
import { build, emptyDir } from '@deno/dnt'

await emptyDir('./npm')

await build({
  packageManager: 'pnpm',
  entryPoints: ['./spektr.ts', './plugins/color.ts'],
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
    name: 'spektr',
    version: Deno.args[0],
    description: 'Elegant CLI framework.',
    license: 'Apache-2.0',
    repository: {
      type: 'git',
      url: 'https://github.com/StauroDEV/spektr.git',
    },
    bugs: {
      url: 'https://github.com/StauroDEV/spektr/issues',
    },
    publishConfig: {
      access: 'public',
    },
    dependencies: {
      picocolors: '^1.1.1',
      table: '^6.8.1',
    },
    devDependencies: {
      '@types/node': 'latest',
      '@types/type-detect': '^4.0.3',
    },
  },
  mappings: {
    'https://deno.land/std@0.224.0/fmt/colors.ts': {
      name: 'colorette',
      version: '^1.1.1',
    },
    'https://deno.land/x/type_detect@v4.0.8/index.js': {
      name: 'type-detect',
      version: '^4.0.8',
    },
    'https://esm.sh/table@6.8.2': {
      name: 'table',
      version: '^6.8.1',
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync('LICENSE', 'npm/LICENSE')
    Deno.copyFileSync('README.md', 'npm/README.md')
  },
})

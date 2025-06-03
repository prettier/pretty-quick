import { defineConfig, type UserConfig } from 'tsdown/config'

const sharedConfig: UserConfig = {
  outDir: 'lib',
}

export default defineConfig([
  {
    ...sharedConfig,
    format: 'esm',
    unbundle: true,
  },
  {
    ...sharedConfig,
    entry: 'src/cli.mts',
    format: 'esm',
    unbundle: true,
  },
  {
    ...sharedConfig,
    format: 'cjs',
    // ESM only
    noExternal: 'tinyexec',
  },
])

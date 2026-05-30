import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const pluginsDir = join(process.cwd(), 'plugins')
const pluginDirs = readdirSync(pluginsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .filter((entry) => !entry.name.startsWith('.') && !entry.name.startsWith('_'))
  .map((entry) => join(pluginsDir, entry.name))
  .filter((dir) => existsSync(join(dir, 'manifest.json')) && existsSync(join(dir, 'package.json')))

for (const pluginDir of pluginDirs) {
  const packageJsonText = readFileSync(join(pluginDir, 'package.json'), 'utf8').replace(/^\uFEFF/, '')
  const packageJson = JSON.parse(packageJsonText)
  if (!packageJson.scripts?.build) {
    console.log(`skip ${packageJson.name}: no build script`)
    continue
  }

  console.log(`build ${packageJson.name}`)
  const result = spawnSync('npm', ['run', 'build', '--workspace', packageJson.name], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

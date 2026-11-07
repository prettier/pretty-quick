import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

let directory: string

// CI builds before testing. Run the built public API in Node so that Git,
// tinyexec and Prettier execute without Jest's manual module mocks.
const runPrettyQuick = (lockIndex = false) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `import fs from 'node:fs';
       import path from 'node:path';
       import { pathToFileURL } from 'node:url';
       const { default: prettyQuick } = await import(pathToFileURL(process.argv[1]));
       const directory = process.argv[2];
       const result = await prettyQuick(directory, {
         staged: true,
         onStageFiles: process.argv[3] === 'true'
           ? () => fs.writeFileSync(path.join(directory, '.git', 'index.lock'), '')
           : undefined,
       });
       process.stdout.write(JSON.stringify(result));`,
        path.resolve(__dirname, '../lib/index.mjs'),
        directory,
        String(lockIndex),
      ],
      { encoding: 'utf8' },
    ),
  )

const git = (...args: string[]) =>
  // Resolve the same Git executable from PATH that pretty-quick uses.
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  execFileSync('git', args, { cwd: directory, encoding: 'utf8' })

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pretty-quick-git-'))
  git('init', '--quiet')
  fs.writeFileSync(path.join(directory, '.prettierrc.json'), '{"semi":true}')
  git('add', '--', '.prettierrc.json')
  git(
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.com',
    '-c',
    'core.hooksPath=/dev/null',
    'commit',
    '--quiet',
    '-m',
    'Initial',
  )
})

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true })
})

const testFilename = process.platform === 'win32' ? test.skip : test

testFilename.each([
  ['中文.js', 'other.js'],
  ['quote"name.js', 'other.js'],
  ['tab\tname.js', 'other.js'],
  ['line\nname.js', 'other.js'],
  ['*中文.js', 'other中文.js'],
  ['[文].js', '文.js'],
  ['-中文.js', 'other.js'],
  [':(glob)*中文.js', 'other中文.js'],
])('restages only the literal file %j', (file, unrelated) => {
  fs.writeFileSync(path.join(directory, file), 'example()')
  fs.writeFileSync(path.join(directory, unrelated), 'unrelated()')
  git('--literal-pathspecs', 'add', '--', file)

  const result = runPrettyQuick()

  expect(result).toEqual({ success: true, errors: [] })
  expect(git('show', ':0:' + file)).toBe('example();\n')
  expect(git('diff', '--cached', '--name-only', '-z')).toBe(file + '\0')
  expect(git('ls-files', '--others', '--exclude-standard', '-z')).toBe(
    unrelated + '\0',
  )
  expect(fs.readFileSync(path.join(directory, unrelated), 'utf8')).toBe(
    'unrelated()',
  )
})

test('reports a failed restage when Git cannot write the index', () => {
  fs.writeFileSync(path.join(directory, 'example.js'), 'example()')
  git('add', '--', 'example.js')
  const result = runPrettyQuick(true)
  expect(result).toEqual({ success: false, errors: ['STAGE_FAILED'] })
  expect(git('show', ':0:example.js')).toBe('example()')
})

# `pretty-quick`

[![GitHub Actions](https://github.com/prettier/pretty-quick/workflows/CI/badge.svg)](https://github.com/prettier/pretty-quick/actions/workflows/ci.yml)
[![Codecov](https://img.shields.io/codecov/c/github/prettier/pretty-quick.svg)](https://codecov.io/gh/prettier/pretty-quick)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fun-ts%2Flib-boilerplate%2Fmain%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
[![npm](https://img.shields.io/npm/v/pretty-quick.svg)](https://www.npmjs.com/package/pretty-quick)
[![GitHub Release](https://img.shields.io/github/release/prettier/pretty-quick)](https://github.com/prettier/pretty-quick/releases)

[![Conventional Commits](https://img.shields.io/badge/conventional%20commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![changesets](https://img.shields.io/badge/maintained%20with-changesets-176de3.svg)](https://github.com/changesets/changesets)

> Get Pretty Quick

Runs [Prettier](https://prettier.io) on your changed files.

![demo](./img/demo.gif)

Supported source control managers:

- Git
- Mercurial

## Install

```sh
# npm
npm install -D prettier pretty-quick
```

```sh
# yarn
yarn add -D prettier pretty-quick
```

## Usage

```sh
# npx
npx pretty-quick

# yarn
yarn pretty-quick
```

## Pre-Commit Hook

You can run `pretty-quick` as a `pre-commit` hook using [`simple-git-hooks`](https://github.com/toplenboren/simple-git-hooks).

```sh
# npm
npm install -D simple-git-hooks

# yarn
yarn add -D simple-git-hooks
```

In `package.json`, add:

```json
"simple-git-hooks": {
  "pre-commit": "pretty-quick --staged"
}
```

## CLI Flags

### `--staged` (only git)

Pre-commit mode. Under this flag only staged files will be formatted, and they will be re-staged after formatting.

Partially staged files will not be re-staged after formatting and pretty-quick will exit with a non-zero exit code. The intent is to abort the git commit and allow the user to amend their selective staging to include formatting fixes.

### `--no-restage` (only git)

Use with the `--staged` flag to skip re-staging files after formatting.

### `--branch`

When not in `staged` pre-commit mode, use this flag to compare changes with the specified branch. Defaults to `master` (git) / `default` (hg) branch.

### `--pattern`

Filters the files for the given [minimatch](https://github.com/isaacs/minimatch) pattern.
For example `pretty-quick --pattern "**/*.*(js|jsx)"` or `pretty-quick --pattern "**/*.js" --pattern "**/*.jsx"`

### `--verbose`

Outputs the name of each file right before it is processed. This can be useful if Prettier throws an error and you can't identify which file is causing the problem.

### `--bail`

Prevent `git commit` if any files are fixed.

### `--check`

Check that files are correctly formatted, but don't format them. This is useful on CI to verify that all changed files in the current branch were correctly formatted.

### `--no-resolve-config`

Do not resolve prettier config when determining which files to format, just use standard set of supported file types & extensions prettier supports. This may be useful if you do not need any customization and see performance issues.

By default, pretty-quick will check your prettier configuration file for any overrides you define to support formatting of additional file extensions.

Example `.prettierrc` file to support formatting files with `.cmp` or `.page` extensions as html.

```json
{
  "printWidth": 120,
  "bracketSpacing": false,
  "overrides": [
    {
      "files": "*.{cmp,page}",
      "options": { "parser": "html" }
    }
  ]
}
```

<!-- Undocumented = Unsupported :D

### `--config`

Path to a `.prettierrc` file.

### `--since`

A SCM revision such as a git commit hash or ref.

For example `pretty-quick --since HEAD` will format only staged files.

-->

### `--ignore-path`

Check an alternative file for ignoring files with the same format as [`.prettierignore`](https://prettier.io/docs/en/ignore#ignoring-files).
For example `pretty-quick --ignore-path .gitignore`

## Configuration and Ignore Files

`pretty-quick` will respect your [`.prettierrc`](https://prettier.io/docs/en/configuration), [`.prettierignore`](https://prettier.io/docs/en/ignore#ignoring-files), and [`.editorconfig`](http://editorconfig.org/) files if you don't use `--ignore-path` . Configuration files will be found by searching up the file system. `.prettierignore` files are only found from the repository root and the working directory that the command was executed from.

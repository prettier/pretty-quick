#!/usr/bin/env node

import chalk from 'chalk'
import mri from 'mri'

import prettyQuick from '.'

const args = mri(process.argv.slice(2), {
  alias: {
    'resolve-config': 'resolveConfig',
    'ignore-path': 'ignorePath',
  },
})

const prettyQuickResult = prettyQuick(process.cwd(), {
  ...args,
  onFoundSinceRevision: (scm, revision) => {
    console.log(
      `🔍  Finding changed files since ${chalk.bold(scm)} revision ${chalk.bold(
        revision,
      )}.`,
    )
  },

  onFoundChangedFiles: changedFiles => {
    console.log(
      `🎯  Found ${chalk.bold(changedFiles.length)} changed ${
        changedFiles.length === 1 ? 'file' : 'files'
      }.`,
    )
  },

  onPartiallyStagedFile: file => {
    console.log(`✗ Found ${chalk.bold('partially')} staged file ${file}.`)
  },

  onWriteFile: file => {
    console.log(`✍️  Fixing up ${chalk.bold(file)}.`)
  },

  onCheckFile: (file, isFormatted) => {
    if (!isFormatted) {
      console.log(`⛔️  Check failed: ${chalk.bold(file)}`)
    }
  },

  onExamineFile: file => {
    console.log(`🔍  Examining ${chalk.bold(file)}.`)
  },
})

if (prettyQuickResult.success) {
  console.log('✅  Everything is awesome!')
} else {
  if (prettyQuickResult.errors.includes('PARTIALLY_STAGED_FILE')) {
    console.log(
      '✗ Partially staged files were fixed up.' +
        ` ${chalk.bold('Please update stage before committing')}.`,
    )
  }
  if (prettyQuickResult.errors.includes('BAIL_ON_WRITE')) {
    console.log(
      '✗ File had to be prettified and prettyQuick was set to bail mode.',
    )
  }
  if (prettyQuickResult.errors.includes('CHECK_FAILED')) {
    console.log(
      '✗ Code style issues found in the above file(s). Forgot to run Prettier?',
    )
  }
  // eslint-disable-next-line n/no-process-exit
  process.exit(1) // ensure git hooks abort
}

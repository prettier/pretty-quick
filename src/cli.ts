#!/usr/bin/env node

import mri from 'mri'
import picocolors from 'picocolors'

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
      `🔍  Finding changed files since ${picocolors.bold(
        scm,
      )} revision ${picocolors.bold(revision)}.`,
    )
  },

  onFoundChangedFiles: changedFiles => {
    console.log(
      `🎯  Found ${picocolors.bold(changedFiles.length)} changed ${
        changedFiles.length === 1 ? 'file' : 'files'
      }.`,
    )
  },

  onPartiallyStagedFile: file => {
    console.log(`✗ Found ${picocolors.bold('partially')} staged file ${file}.`)
  },

  onWriteFile: file => {
    console.log(`✍️  Fixing up ${picocolors.bold(file)}.`)
  },

  onCheckFile: (file, isFormatted) => {
    if (!isFormatted) {
      console.log(`⛔️  Check failed: ${picocolors.bold(file)}`)
    }
  },

  onExamineFile: file => {
    console.log(`🔍  Examining ${picocolors.bold(file)}.`)
  },
})

if (prettyQuickResult.success) {
  console.log('✅  Everything is awesome!')
} else {
  if (prettyQuickResult.errors.includes('PARTIALLY_STAGED_FILE')) {
    console.log(
      '✗ Partially staged files were fixed up.' +
        ` ${picocolors.bold('Please update stage before committing')}.`,
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

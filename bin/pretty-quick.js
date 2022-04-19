#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const mri = require('mri');

const prettyQuick = require('..').default;

const args = mri(process.argv.slice(2), {
  alias: {
    'resolve-config': 'resolveConfig',
    'ignore-path': 'ignorePath',
  },
});

const prettyQuickResult = prettyQuick(
  process.cwd(),
  Object.assign({}, args, {
    onFoundSinceRevision: (scm, revision) => {
      console.log(
        `🔍  Finding changed files since ${chalk.bold(
          scm,
        )} revision ${chalk.bold(revision)}.`,
      );
    },

    onFoundChangedFiles: (changedFiles) => {
      console.log(
        `🎯  Found ${chalk.bold(changedFiles.length)} changed ${
          changedFiles.length === 1 ? 'file' : 'files'
        }.`,
      );
    },

    onPartiallyStagedFile: (file) => {
      console.log(`✗ Found ${chalk.bold('partially')} staged file ${file}.`);
    },

    onWriteFile: (file) => {
      console.log(`✍️  Fixing up ${chalk.bold(file)}.`);
    },

    onCheckFile: (file, isFormatted) => {
      if (!isFormatted) {
        console.log(`⛔️  Check failed: ${chalk.bold(file)}`);
      }
    },

    onExamineFile: (file) => {
      console.log(`🔍  Examining ${chalk.bold(file)}.`);
    },

    onStageFiles: () => {
      console.log(`🏗️  Staging changed files.`);
    },
  }),
);

if (prettyQuickResult.success) {
  console.log('✅  Everything is awesome!');
} else {
  if (prettyQuickResult.errors.indexOf('PARTIALLY_STAGED_FILE') !== -1) {
    console.log(
      '✗ Partially staged files were fixed up.' +
        ` ${chalk.bold('Please update stage before committing')}.`,
    );
  }
  if (prettyQuickResult.errors.indexOf('BAIL_ON_WRITE') !== -1) {
    console.log(
      '✗ File had to be prettified and prettyQuick was set to bail mode.',
    );
  }
  if (prettyQuickResult.errors.indexOf('CHECK_FAILED') !== -1) {
    console.log(
      '✗ Code style issues found in the above file(s). Forgot to run Prettier?',
    );
  }
  if (prettyQuickResult.errors.indexOf('STAGE_FAILED') !== -1) {
    console.log(
      '✗ Could not stage files. Please stage files manually before committing.',
    );
  }
  process.exit(1); // ensure git hooks abort
}

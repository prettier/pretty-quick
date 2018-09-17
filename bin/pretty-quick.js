#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const mri = require('mri');

const prettyQuick = require('..').default;

const args = mri(process.argv.slice(2), { default: { restage: true } });

let success = true;
prettyQuick(
  process.cwd(),
  Object.assign({}, args, {
    onFoundSinceRevision: (scm, revision) => {
      console.log(
        `🔍  Finding changed files since ${chalk.bold(
          scm
        )} revision ${chalk.bold(revision)}.`
      );
    },

    onFoundChangedFiles: changedFiles => {
      console.log(
        `🎯  Found ${chalk.bold(changedFiles.length)} changed ${
          changedFiles.length === 1 ? 'file' : 'files'
        }.`
      );
    },

    onPartiallyStagedFile: file => {
      console.log(`✗ Found ${chalk.bold('partially')} staged file ${file}.`);
      success = false;
    },

    onWriteFile: file => {
      console.log(`✍️  Fixing up ${chalk.bold(file)}.`);
    },
  })
);

if (success) {
  console.log('✅  Everything is awesome!');
} else {
  console.log(
    '✗ Partially staged files were fixed up.' +
      ` ${chalk.bold('Please update stage before committing')}.`
  );
  process.exit(1); // ensure git hooks abort
}

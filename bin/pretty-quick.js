#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const mri = require('mri');

const prettyQuick = require('..').default;

const args = mri(process.argv.slice(2));

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

    onWriteFile: file => {
      console.log(`✍️  Fixing up ${chalk.bold(file)}.`);
    },
  })
);

console.log('✅  Everything is awesome!');

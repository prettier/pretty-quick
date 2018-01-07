#!/usr/bin/env node

"use strict";

const prettier = require('prettier');
const mri = require('mri');

const args = mri(process.argv.slice(2));


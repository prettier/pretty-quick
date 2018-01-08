# `pretty-quick`

[![Travis](https://img.shields.io/travis/azz/pretty-quick.svg?style=flat-square)](https://travis-ci.org/azz/pretty-quick)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![npm](https://img.shields.io/npm/v/pretty-quick.svg?style=flat-square)](https://npmjs.org/pretty-quick)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

> Get Pretty Quick

Runs [Prettier](https://prettier.io) on your changed files.

![](http://g.recordit.co/eEOOyI2v1r.gif)

Supported source control managers:

* Git
* _Add more_

## Install

With `yarn`:

```shellsession
yarn add --dev prettier pretty-quick
```

With `npm`:

```shellsession
npm install --save-dev prettier pretty-quick
```

## Usage

With `yarn`:

```shellsession
yarn pretty-quick
```

With [`npx`](https://npm.im/npx): (No install required)

```shellsession
npx pretty-quick
```

With `npm`:

1. Add `"pretty-quick": "pretty-quick"` to the scripts section of `package.json`.
2. `npm run pretty-quick`

## Pre-Commit Hook

You can run `pretty-quick` as a pre-commit hook using [`husky`](https://github.com/typicode/husky).

```shellstream
yarn add --dev husky
```

In `package.json`'s `"scripts"` section, add:

```
"precommit": "pretty-quick --since HEAD"
```



## CLI Flags

### `--since`

A SCM revision such as a git commit hash or ref.

For example `pretty-quick --since HEAD` will format only staged files.


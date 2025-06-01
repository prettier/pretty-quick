import base from '@1stg/eslint-config'

export default [
  ...base,
  {
    rules: {
      '@typescript-eslint/no-duplicate-type-constituents': 'off',
      'unicorn-x/prefer-node-protocol': 'off',
    },
  },
]

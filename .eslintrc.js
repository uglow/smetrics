module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:node/recommended',
  ],

  // required to lint *.vue files
  plugins: ['node'],
  // add your custom rules here
  rules: {
    'prefer-const': 'error',
    'no-var': 'error',

    // Turn off this rule as it is needed for web-component-lib integration (Nuxt.js doesn't like ESM files, yet)
    'import/no-webpack-loader-syntax': 'off',
    'import/no-unresolved': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

    // Turn off node/no-unsupported-features because it complains about import & export
    'node/no-unsupported-features': 'off',
  },
};

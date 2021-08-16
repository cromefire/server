module.exports = {
  singleQuote: true,
  arrowParens: 'always',
  trailingComma: 'all',
  semi: true,
  useTabs: false,
  tabWidth: 2,
  quoteProps: 'consistent',
  bracketSpacing: true,
  printWidth: 100,
  overrides: [
    {
      files: ['**/*.html'],
      options: {
        singleQuote: false,
      },
    },
  ],
};

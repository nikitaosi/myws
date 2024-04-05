module.exports = {
  extends: ["plugin:astro/recommended",], parser: "astro-eslint-parser", parserOptions: {
    parser: "@typescript-eslint/parser", extraFileExtensions: [".astro"],
  }, ignorePatterns: ["/dist/**/*.js"], overrides: [{
    files: ["*.astro"],
  },],
}

module.exports = {
  transform: {
    "^.+\\.tsx?$": "esbuild-jest",
  },
  // jestはtsconfigのbaseUrl(".")を解釈しないため、tscでは解決できる
  // `src/...` 形式の絶対importがjestでは解決できない。そのためここで対応づける

  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
};

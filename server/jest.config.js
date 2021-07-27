module.exports = {
  collectCoverage: true,
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ["/node_modules/"],
  coverageProvider: "v8",
  roots: ["<rootDir>/src/"],
  testMatch: ["**/__tests__/**/*.+(test.ts)"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  testEnvironment: "<rootDir>/test.env.js",
  setupFilesAfterEnv: ["<rootDir>/test.setup.js"],
  testTimeout: 10000,
};

import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: [],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.(ts|tsx|js|jsx|mjs)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  transformIgnorePatterns: ["node_modules/(?!(nanoid)/)"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "mjs"],
};

export default config;

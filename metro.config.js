// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add polyfill resolvers
config.resolver.extraNodeModules.crypto = require.resolve('expo-crypto');

// Spike: some newer packages (e.g. @metaplex-foundation/umi) ship subpath
// exports (like "umi/serializers") that only resolve if Metro honors the
// package.json "exports" map.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;

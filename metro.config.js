// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package.json exports support (workaround for potential SDK 53 / RN 0.79 issues)
config.resolver.unstable_enablePackageExports = false;

module.exports = config; 
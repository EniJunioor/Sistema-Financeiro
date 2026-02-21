const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const configWithNativeWind = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});

// Force single React resolution (fixes "Invalid hook call" / "useRef of null" on some machines)
// Applied after withNativeWind so it is not overwritten
configWithNativeWind.resolver.extraNodeModules = {
  ...configWithNativeWind.resolver.extraNodeModules,
  react: path.resolve(__dirname, "node_modules/react"),
  "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
  "react-native": path.resolve(__dirname, "node_modules/react-native"),
};

module.exports = configWithNativeWind;

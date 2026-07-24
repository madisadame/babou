module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 utilise le plugin worklets ; il doit rester en dernier.
    plugins: ['react-native-worklets/plugin'],
  };
};

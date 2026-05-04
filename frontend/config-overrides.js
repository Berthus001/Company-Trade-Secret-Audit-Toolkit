/**
 * Override webpack configuration for Create React App
 * without ejecting
 */

module.exports = function override(config, env) {
  // Ignore source map warnings from third-party libraries
  config.ignoreWarnings = [
    {
      module: /node_modules\/html2pdf\.js/,
      message: /Failed to parse source map/,
    },
    function (warning) {
      return (
        warning.module &&
        warning.module.resource &&
        warning.module.resource.includes('node_modules') &&
        warning.message &&
        warning.message.includes('source map')
      );
    },
  ];

  return config;
};

module.exports = function(filePath) {
  try {
    const CLIEngine = require('eslint').CLIEngine;
    const cliEngineForConfig = new CLIEngine();
    const config = Object.create(cliEngineForConfig.getConfigForFile(filePath));
    config.fix = true;
    const cliEngineForFix = new CLIEngine(config);
    return {
      eslintFixer: function(input) {
        return (
          cliEngineForFix.executeOnText(input, filePath, false).results[0]
            .output || ''
        );
      },
    };
  } catch (e) {
    throw new Error('Could not load eslint module.');
  }
};

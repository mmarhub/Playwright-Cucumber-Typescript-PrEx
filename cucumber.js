// Cucumber configuration - controls how Cucumber runs your tests
module.exports = {
  default: {
    // Tags to filter which scenarios to run - call with npm run test --TAGS="@smoke"
    // tags: process.env.npm_config_TAGS || "@wip",

    // Path to feature files
    paths: ['src/features/**/*.feature'],

    // Where to find step definitions and hooks
    require: [
      'src/steps/**/*.ts',
      'src/hooks/**/*.ts',
      'src/utils/**/*.ts'  // Custom World implementation
    ],

    // Use ts-node to run TypeScript files without pre-compilation
    requireModule: ['ts-node/register'],

    // Output formats for test results
    format: [
      'progress-bar',                              // Show progress bar in terminal
      'json:test-reports/cucumber-report.json',         // JSON format for report generation
      'html:test-reports/cucumber-report.html'          // Basic HTML report
    ],

    // Format options
    formatOptions: {
      snippetInterface: 'async-await'  // Generate step definitions using async/await syntax
    },

    // Don't publish results to Cucumber's cloud service
    publishQuiet: true,

    // Run tests in parallel with 3 workers (threads)
    // Each worker runs scenarios independently for faster execution
    parallel: 2
  }
};

  require('dotenv').config();
  const { defineConfig } = require('cypress');

  module.exports = defineConfig({
    viewportWidth: 1920,
    viewportHeight: 1200,
    env: {
      NODE_ENV: { ...process.env },
    },
    e2e: {
      defaultCommandTimeout: 10000,
      testIsolation: false,
      setupNodeEvents(on, config) {
        
        return config;
      },
      screenshotsFolder: 'cypress/reports/screenshots',
      videosFolder: 'cypress/reports/videos',
      video: false,
      screenshotOnRunFailure: true,
      reporter: 'mochawesome',
      reporterOptions: {
        reportDir: 'cypress/reports',
        overwrite: false,
        cleanReporterJson: false,
        html: true,
        json: true,
        reportFilename: 'report',
        embeddedScreenshots: true,
        inlineAssets: true,
      },
    },
  });
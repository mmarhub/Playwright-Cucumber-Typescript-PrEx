/**
 * Cucumber Hooks
 * 
 * Hooks are special functions that run at specific points in the test lifecycle.
 * They handle setup and teardown operations automatically.
 * 
 * Hook Types:
 * - BeforeAll: Runs once before all scenarios
 * - Before: Runs before each scenario
 * - After: Runs after each scenario
 * - AfterAll: Runs once after all scenarios
 * 
 * Why use hooks?
 * - Automatic setup/cleanup (no manual calls needed)
 * - Consistent test environment
 * - Resource management (browsers, files, etc.)
 * - Screenshot/video capture on failure
 */

import { Before, After, Status, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { CustomWorld } from '../utils/World';
import stripAnsi from 'strip-ansi';
import { setEnvValue } from '../utils/env-utils';

/**
 * BeforeAll Hook
 * 
 * Runs ONCE before any scenario executes
 * Perfect for:
 * - Creating report directories
 * - Starting test servers
 * - Loading test data
 * - Global setup tasks
 */
BeforeAll(async function () {
  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 Test Execution Started');
  console.log(`📅 Test Started Time: ${new Date().toLocaleString()}`);
  console.log(`🌐 Base URL: ${process.env.BASE_URL || 'Not configured'}`);
  console.log(`🌐 Browser: ${process.env.BROWSER || 'chromium'}`);
  console.log(`👁️ Headless: ${process.env.HEADLESS || 'true'}`);
  console.log('═══════════════════════════════════════════════════\n');

  const startedTime = new Date().toLocaleString();
  // Save it to .env for later use (e.g., in reports)
  await setEnvValue('TEST_STARTED_TIME', startedTime);
});

/**
 * Before Hook
 * 
 * Runs BEFORE EACH scenario
 * This is where we set up a fresh browser for each test
 * 
 * Why fresh browser per scenario?
 * - Test isolation: No data leakage between tests
 * - Thread safety: Parallel scenarios don't interfere
 * - Clean state: No cookies, cache, or storage from previous test
 * 
 * @param pickle - Contains scenario information (name, id, tags, etc.)
 * 
 * 'this' context:
 * - Inside hooks, 'this' refers to the CustomWorld instance
 * - Type annotation 'this: CustomWorld' enables TypeScript autocomplete
 */
Before(async function (this: CustomWorld, { pickle }) {
  // Log which scenario is starting (helpful for debugging)
  console.log(`Starting scenario: ${pickle.name}`);
  
  // Log the process ID (thread) for parallel execution tracking
  this.attach(`This scenario runs in Thread ID: ${process.pid}`);

  // STEP 1: Launch browser (Chrome/Firefox/Safari based on config)
  await this.browserManager.launchBrowser(this);

  // STEP 2: Create isolated browser context (like incognito mode)
  await this.browserManager.createContext();

  // STEP 3: Create page (tab) and store in World for step definitions to use
  this.page = await this.browserManager.createPage();

  // STEP 4: Generate unique test data for this scenario (THREAD-SAFE)
  // Each scenario gets unique IDs to prevent data conflicts in parallel execution

  // Store scenario ID (unique identifier from Cucumber)
  this.testData.set('scenarioId', pickle.id);

  // Store timestamp (current time in milliseconds since 1970)
  this.testData.set('timestamp', Date.now());

  // Generate unique email using scenario ID and timestamp
  // Example: test_abc123_1699123456789@example.com
  // This ensures no two scenarios use the same email, even when running in parallel
  this.testData.set('uniqueEmail', `test_${pickle.id}_${Date.now()}@example.com`);

  // You can add more unique data as needed:
  // this.testData.set('uniqueUsername', `user_${pickle.id}`);
  // this.testData.set('uniqueOrderId', `order_${Date.now()}`);
});

/**
 * After Hook
 * 
 * Runs AFTER EACH scenario (whether it passes or fails)
 * Handles cleanup and failure capture
 * 
 * @param pickle - Scenario information
 * @param result - Test result (status, error, duration)
 * 
 * Execution order:
 * 1. Scenario runs
 * 2. After hook runs (even if scenario failed)
 * 3. Resources cleaned up
 */
After(async function (this: CustomWorld, { pickle, result }) {
  // Log scenario result
  console.log(`Scenario: ${pickle.name} - Status: ${result?.status}`);

  // If scenario failed, take a screenshot for debugging
  if (result?.status === Status.FAILED && this.page) {

    if (result.message) {
      // Clean the message text first
      const cleanMessage = stripAnsi(result.message);

      // Replace the original error message (so the report uses the clean one)
      result.message = cleanMessage;

      // Optionally attach it (useful if your reporter doesn't render result.message)
      this.attach(cleanMessage, 'text/plain')
    }

    // Create filename from scenario name (replace spaces with underscores)
    // Example: "User login with valid credentials" -> "User_login_with_valid_credentials"
    //const screenshotPath = `reports/screenshots/${pickle.name.replace(/\s+/g, '_')}-${Date.now()}.png`;

    // Take screenshot as buffer (binary data)
    const screenshot = await this.page.screenshot({
      fullPage: true,
      type: 'png'
    });

    // Attach to Cucumber report - THIS IS KEY!
    this.attach(screenshot, 'image/png');

    // Log screenshot location
    //console.log(`Screenshot saved: ${screenshotPath}`);
  }

  // CRITICAL: Always close browser to free up resources
  // Without this, you'll have memory leaks and hanging browser processes
  await this.browserManager.closeBrowser();

  // Clear test data for this scenario
  this.testData.clear();
});

/**
 * AfterAll Hook
 * 
 * Runs ONCE after all scenarios complete
 * Use for final cleanup and reporting
 */
AfterAll(async function () {
  console.log('Test execution completed!');
  console.log(`📅 Test Completed Time: ${new Date().toLocaleString()}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 To view the detailed HTML report, run:');
  console.log('   npm run report');
  console.log('   Then open: reports/html-report/index.html');
  console.log('═══════════════════════════════════════════════════');

  const completedTime = new Date().toLocaleString();
  // Save it to .env for later use (e.g., in reports)
  await setEnvValue('TEST_COMPLETED_TIME', completedTime);

  // You can add additional cleanup here:
  // - Close database connections
  // - Send test results to external systems
  // - Generate final reports
});

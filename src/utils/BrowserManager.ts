/**
 * Browser Manager - Manages Browser Lifecycle
 * 
 * This class handles all browser-related operations:
 * - Launching browsers (Chrome/Firefox/Safari)
 * - Creating browser contexts (isolated browser sessions)
 * - Creating pages (tabs)
 * - Closing browsers properly
 * 
 * Why use this class?
 * - Encapsulates browser complexity
 * - Ensures proper cleanup (prevents resource leaks)
 * - Makes browser management reusable
 * - Thread-safe: Each scenario gets its own instance
 */

import { Browser, BrowserContext, Page, chromium, firefox, webkit } from '@playwright/test';
import { config } from '../config/config';
import { setEnvValue } from './env-utils';
import { CustomWorld } from './World';

export class BrowserManager {
  // Private properties - only accessible within this class
  // Using '| null' because these are undefined until initialized
  private browser: Browser | null = null;              // The browser instance
  private context: BrowserContext | null = null;       // Browser context (isolated session)
  private page: Page | null = null;                    // The page/tab instance
  private scenario: CustomWorld | null = null;         // The scenario context

  /**
   * Launch Browser - Initialize and start the browser process
   * 
   * Logic:
   * - Reads browser type from configuration (chromium, firefox, or webkit)
   * - Uses switch statement to select appropriate Playwright browser launcher
   * - Launches the selected browser with headless mode and custom launch options
   * - Retrieves browser version and stores it in environment variables for reporting
   * - Stores the scenario context for later access throughout the test
   * 
   * Why different browsers?
   * - Test cross-browser compatibility - some UI rendering differs by browser
   * - Browser-specific bugs - certain issues only appear in specific browsers
   * - User coverage - users test on Chrome, Firefox, Safari, etc.
   * 
   * Browser Types Supported:
   * - 'chromium': Chrome/Edge browsers (Chromium-based)
   * - 'firefox': Firefox browser engine
   * - 'webkit': Safari browser engine (WebKit)
   * 
   * @param sce - The CustomWorld scenario context object that contains test data and hooks
   * 
   * Return: void - No return value, but initializes internal browser instance
   * 
   * Side Effects:
   * - Initializes this.browser with launched browser instance
   * - Stores this.scenario for access to test context
   * - Sets RUN_BROWSER_VERSION environment variable
   * 
   * Prerequisites:
   * - config.browser must be set to a valid value ('chromium', 'firefox', 'webkit')
   * - config.headless must be defined (boolean)
   * - config.launchOptions must be defined (can be empty object)
   * 
   * Method Sequence: FIRST step in browser setup
   * - launchBrowser() -> createContext() -> createPage() -> [test execution] -> closeBrowser()
   * 
   * Usage Example:
   * ```typescript
   * const browserManager = new BrowserManager();
   * const scenario = new CustomWorld({ ... });
   * 
   * // Launcher browser based on config (e.g., 'chromium')
   * await browserManager.launchBrowser(scenario);
   * console.log('Browser launched successfully');
   * 
   * // Browser is now ready for context creation
   * ```
   * 
   * Error Scenarios: 
   * - If config.browser is not one of the valid types, switch statement falls through silently
   *   (consider adding default case for error handling)
   * - May throw if browser installation is missing
   */
  async launchBrowser(sce: CustomWorld): Promise<void> {
    const browserType = config.browser;

    // Switch statement selects browser based on config - determines which engine to use
    switch (browserType) {
      case 'chromium':
        // Launch Chromium-based browser (Chrome, Edge, Brave)
        // headless: true = run without GUI, false = show browser window
        // launchOptions spread: includes proxy, args, slowMo, timeout settings etc.
        this.browser = await chromium.launch({
          headless: config.headless,      // Show/hide browser window
          ...config.launchOptions         // Spread operator: includes all additional launch options
        });
        break;
      case 'firefox':
        // Launch Firefox browser with same configuration options
        this.browser = await firefox.launch({
          headless: config.headless,
          ...config.launchOptions
        });
        break;
      case 'webkit':
        // Launch WebKit browser (Safari engine) with same configuration options
        this.browser = await webkit.launch({
          headless: config.headless,
          ...config.launchOptions
        });
        break;
    }

    // Get browser version string and store in environment for later use in reports/logs
    const browserVersion = await this.browser.version();
    // Save it to .env for later use (e.g., in reports, CI/CD logs, debugging)
    await setEnvValue('RUN_BROWSER_VERSION', browserVersion);

    // Store the scenario variable from CustomWorld for using anywhere in the test
    // This enables access to scenario data, hooks, and test context throughout BrowserManager
    this.scenario = sce;
  }

  /**
   * Create Browser Context - Create an isolated browser session
   * 
   * Logic:
   * - Validates that browser has been launched (guard clause)
   * - Creates a new BrowserContext from the launched browser instance
   * - A context is like an "incognito window" - isolated, clean browser session
   * - Sets viewport to null (use full screen resolution)
   * - Currently disables video recording and tracing (commented out but available)
   * 
   * What is a Browser Context?
   * - Isolated session with separate cookies, localStorage, sessionStorage, cache
   * - Can run multiple contexts simultaneously for parallel test execution
   * - One context's actions don't affect another context (test isolation)
   * - Each scenario typically gets one context
   * 
   * Why use contexts?
   * - Test isolation: Each test starts fresh with clean state
   * - Parallel execution: Multiple contexts can run simultaneously without interfering
   * - Security: One test can't affect another test's data or state
   * - Realism: Mimics how users run multiple isolated browser sessions
   * 
   * Key Properties Configured:
   * - viewport: null = use full screen resolution (can be set to specific size like { width: 1920, height: 1080 })
   * - recordVideo: Currently disabled (uncomment to record test execution videos)
   * - tracing: Currently disabled (uncomment to record detailed traces for debugging)
   * 
   * Prerequisites (MUST call in order):
   * - launchBrowser() must be called first to initialize this.browser
   * 
   * Method Sequence: SECOND step in browser setup
   * - launchBrowser() -> createContext() -> createPage() -> [test execution] -> closeBrowser()
   * 
   * Return: void - No return value, but initializes internal context instance
   * 
   * Side Effects:
   * - Initializes this.context with new BrowserContext
   * - Creates isolated session for this test/scenario
   * 
   * Throws: Error if launchBrowser() wasn't called first (guard clause)
   * 
   * Usage Example:
   * ```typescript
   * const browserManager = new BrowserManager();
   * await browserManager.launchBrowser(scenario);
   * 
   * // Now create isolated context
   * await browserManager.createContext();
   * console.log('Context created - isolated browser session ready');
   * 
   * // Now can create page in this context
   * const page = await browserManager.createPage();
   * ```
   * 
   * Advanced Features (Commented Out):
   * 
   * To enable video recording:
   * ```typescript
   * recordVideo: { dir: 'reports/videos/' }  // Records all test interactions as video
   * ```
   * 
   * To enable tracing for debugging:
   * ```typescript
   * await this.context.tracing.start({
   *   screenshots: true,   // Captures screenshots during test for visual debugging
   *   snapshots: true      // Captures DOM state snapshots at each step
   * });
   * // Then in cleanup: await this.context.tracing.stop({ path: 'reports/trace.zip' })
   * ```
   */
  async createContext(): Promise<void> {
    // Guard clause: Ensure browser is launched first - prevents errors from null browser
    if (!this.browser) {
      throw new Error('Browser not launched. Call launchBrowser() first.');
    }

    // Get viewport size of the screen (currently commented out - using full screen instead)
    // const width = window.innerWidth;
    // const height = window.innerHeight;

    // Create new browser context (isolated browser session) with custom viewport and recording
    this.context = await this.browser.newContext({
      // Set viewport size (screen resolution for the context)
      // viewport: null = use full available screen
      // viewport: { width: 1920, height: 1080 } = fixed desktop size
      // viewport: { width: 375, height: 667 } = mobile device size
      viewport: null,
      //viewport: { width, height },

      // Record video of test execution - useful for debugging failures
      // Uncomment to enable: records all interactions to reports/videos/
      // Note: Significantly increases test execution time and storage
      //recordVideo: { dir: 'reports/videos/' }
    });

    // Start tracing - records detailed test execution for advanced debugging
    // Uncomment to enable: captures visual snapshots and DOM state at each action
    // Note: Can slow down tests, use only when debugging specific failures
    // await this.context.tracing.start({
    //   screenshots: true,   // Capture visual screenshots during test
    //   snapshots: true      // Capture DOM snapshots for state inspection
    // });
  }

  /**
   * Create Page - Create a new browser tab/page in the context
   * 
   * Logic:
   * - Validates that context has been created (guard clause)
   * - Creates a new Page object (browser tab) within the context
   * - Sets default timeout for all subsequent operations on this page
   * - Timeout ensures tests don't hang indefinitely on unresponsive pages
   * - Returns the created page for immediate use in tests
   * 
   * What is a Page?
   * - Represents a single browser tab (like opening a new tab in Chrome)
   * - Contains all methods for interacting with webpage (click, type, navigate, etc.)
   * - Has its own viewport, URL, and document
   * - Page is what you use to perform all test actions
   * 
   * Timeout Configuration:
   * - Default timeout from config applies to:
   *   - page.goto(url) - navigation
   *   - page.click(selector) - clicking elements
   *   - page.fill(selector, text) - filling inputs
   *   - page.waitForSelector(selector) - waiting for elements
   *   - Any other page action that can timeout
   * - If action exceeds this timeout, it throws TimeoutError
   * 
   * Prerequisites (MUST call in order):
   * - launchBrowser() must be called first
   * - createContext() must be called second
   * 
   * Method Sequence: THIRD step in browser setup
   * - launchBrowser() -> createContext() -> createPage() -> [test execution] -> closeBrowser()
   * 
   * @returns Page - The newly created page/tab object for test interactions
   * 
   * Return Value Details:
   * - Page object has methods like: goto(), click(), fill(), waitForSelector(), etc.
   * - Page object is what you pass around in test steps to interact with webpage
   * 
   * Side Effects:
   * - Initializes this.page with new Page instance
   * - Creates browser tab in the isolated context
   * - Sets default timeout for all page operations
   * 
   * Throws: Error if createContext() wasn't called first (guard clause)
   * 
   * Usage Example:
   * ```typescript
   * const browserManager = new BrowserManager();
   * await browserManager.launchBrowser(scenario);
   * await browserManager.createContext();
   * 
   * // Create new page/tab
   * const page = await browserManager.createPage();
   * 
   * // Now use page for test interactions
   * await page.goto('https://github.com');
   * await page.click('text=Sign In');
   * 
   * // Or get page later using getPage()
   * const samePage = browserManager.getPage();
   * await samePage.fill('#username', 'testuser');
   * ```
   * 
   * Multiple Pages Example:
   * ```typescript
   * // Create first page/tab
   * const page1 = await browserManager.createPage();
   * await page1.goto('https://example.com');
   * 
   * // Note: Each createPage() call overwrites this.page
   * // Only getPage() will return the last created page
   * // Store pages separately if you need multiple:
   * const page2 = await browserManager.getContext().newPage();
   * ```
   */
  async createPage(): Promise<Page> {
    // Guard clause: Ensure context exists before creating page
    // A page must belong to a context, so context must be created first
    if (!this.context) {
      throw new Error('Context not created. Call createContext() first.');
    }

    // Create new page (tab) within the current context
    // Each page is isolated within the context but shares context state
    this.page = await this.context.newPage();

    // Set default timeout for all operations on this page
    // This timeout applies to: goto(), click(), fill(), waitForSelector(), etc.
    // If an action takes longer than this, it will throw TimeoutError
    // Example: if page.goto() takes > 30000ms, it fails
    this.page.setDefaultTimeout(config.timeout);

    // Return the created page for immediate use in tests
    return this.page;
  }

  /**
   * Close Browser - Properly cleanup and close all browser resources
   * 
   * Logic:
   * - Stops tracing (if enabled) and saves trace file for debugging
   * - Closes page (tab) - releases page resources
   * - Closes context (session) - releases context and all its cookies/storage
   * - Closes browser - releases browser process entirely
   * - Uses null checks to handle cases where resources may not exist
   * 
   * IMPORTANT: Always call this method to prevent resource leaks
   * - If not called, browser process stays running, consuming memory and OS resources
   * - Tests will accumulate resources and system will eventually run out of memory
   * - Tests may fail with "too many files open" or "out of memory" errors
   * 
   * Order Matters: CRITICAL - Resources must be closed in correct order
   * 1. Stop tracing (save trace file) - records test execution for debugging
   * 2. Close page - release tab/page resources first
   * 3. Close context - release session after page is closed
   * 4. Close browser - finally close browser process
   * 
   * Why this order?
   * - Page must close before context (page depends on context)
   * - Context must close before browser (context depends on browser)
   * - Can't close parent before children (same hierarchy as DOM)
   * - Getting order wrong may cause hanging or incomplete cleanup
   * 
   * Prerequisites:
   * - Called at end of test/scenario in hooks or cleanup blocks
   * - Should be called in try/finally to ensure cleanup even if test fails
   * 
   * Method Sequence: FINAL step in browser lifecycle
   * - launchBrowser() -> createContext() -> createPage() -> [test execution] -> closeBrowser()
   * 
   * Return: void - No return value, just performs cleanup
   * 
   * Side Effects:
   * - Nullifies/closes all internal browser resources
   * - Releases memory and OS resources
   * - Saves trace file if tracing was enabled
   * - Browser process terminates
   * 
   * Important Notes:
   * - Safe to call even if some resources weren't created (null checks)
   * - Safe to call multiple times (harmless if already closed)
   * - No exceptions thrown - silently handles missing resources
   * 
   * Throws: No exceptions - method handles all error scenarios gracefully
   * 
   * Usage Example:
   * ```typescript
   * const browserManager = new BrowserManager();
   * 
   * try {
   *   // Setup
   *   await browserManager.launchBrowser(scenario);
   *   await browserManager.createContext();
   *   const page = await browserManager.createPage();
   *   
   *   // Test execution
   *   await page.goto('https://github.com');
   *   await page.click('text=Sign In');
   *   
   * } finally {
   *   // Always cleanup - even if test fails or throws error
   *   await browserManager.closeBrowser();
   * }
   * ```
   * 
   * In BDD Hooks (hooks.ts):
   * ```typescript
   * After(async function(scenario) {
   *   // Cleanup after each scenario
   *   await this.browserManager.closeBrowser();
   * });
   * ```
   * 
   * Tracing for Debugging:
   * Uncomment tracing code to save trace file for failed tests:
   * ```typescript
   * await this.context.tracing.stop({ path: 'reports/trace.zip' });
   * // Later: open in Playwright Inspector: npx playwright show-trace reports/trace.zip
   * ```
   */
  async closeBrowser(): Promise<void> {
    // Stop tracing and save to file (for debugging failed tests)
    // Uncomment to enable: captures detailed trace of test execution
    // Trace files can be viewed in Playwright Inspector for visual debugging
    // Useful when tests fail and you need to see exactly what happened
    // if (this.context) {
    //   await this.context.tracing.stop({ path: 'reports/trace.zip' });
    // }

    // Close page if it exists - release page/tab resources
    // Null check: if page was never created, skip closing (no error)
    // Closing page first because page depends on context
    if (this.page) await this.page.close();

    // Close context if it exists - release session context and its resources
    // Null check: if context was never created, skip closing (no error)
    // Closing context second because context depends on browser
    if (this.context) await this.context.close();

    // Close browser if it exists - release browser process entirely
    // Null check: if browser was never launched, skip closing (no error)
    // Closing browser last because page/context depend on browser
    if (this.browser) await this.browser.close();
  }

  /**
   * Get Page - Retrieve the current page/tab instance
   * 
   * Logic:
   * - Returns the current page instance that was created in createPage()
   * - Validates that page exists (guard clause)
   * - Throws error if page was never created (prevents null reference errors)
   * - This is the primary way to access page in test steps and page objects
   * 
   * What is a Page?
   * - Page object from Playwright test library
   * - Contains all methods for interacting with webpage:
   *   - Navigation: page.goto(), page.goBack(), page.reload()
   *   - Interaction: page.click(), page.fill(), page.hover(), page.select()
   *   - Waiting: page.waitForSelector(), page.waitForNavigation(), page.waitForFunction()
   *   - Inspection: page.locator(), page.$(), page.$$()
   *   - Content: page.content(), page.title(), page.url()
   * 
   * Why use this getter?
   * - Centralized access to page object throughout test
   * - Guard clause prevents errors from using page before creation
   * - Allows page object to be stored privately in BrowserManager
   * - Decouples test code from internal page management
   * 
   * @returns Page - The Playwright Page object for interacting with webpage
   * 
   * Return Value Usage:
   * ```typescript
   * const page = browserManager.getPage();
   * await page.goto('https://github.com');
   * await page.click('#login-button');
   * const title = await page.title();
   * ```
   * 
   * Prerequisites:
   * - createPage() must be called first to initialize the page
   * 
   * Throws: Error if createPage() wasn't called first (guard clause)
   * 
   * Error Scenario:
   * ```typescript
   * const browserManager = new BrowserManager();
   * const page = browserManager.getPage(); // ❌ THROWS ERROR - no page created yet
   * 
   * // Correct usage:
   * await browserManager.launchBrowser(scenario);
   * await browserManager.createContext();
   * await browserManager.createPage();
   * const page = browserManager.getPage(); // ✅ OK - page was created
   * ```
   * 
   * Usage in Page Object Pattern:
   * ```typescript
   * export class LoginPage {
   *   constructor(private browserManager: BrowserManager) {}
   *   
   *   async login(username: string, password: string) {
   *     const page = this.browserManager.getPage();
   *     await page.fill('#username', username);
   *     await page.fill('#password', password);
   *     await page.click('#login-button');
   *   }
   * }
   * ```
   * 
   * Usage in Step Definitions:
   * ```typescript
   * Given('user navigates to GitHub', async function() {
   *   const page = this.browserManager.getPage();
   *   await page.goto('https://github.com');
   * });
   * ```
   */
  getPage(): Page {
    // Guard clause: Ensure page exists - prevents null reference errors
    // Throws descriptive error if page wasn't created yet
    // Error message tells user exactly what to do to fix it
    if (!this.page) {
      throw new Error('Page not created. Call createPage() first.');
    }
    return this.page;
  }

  /**
   * Get Browser Context - Retrieve the current browser context instance
   * 
   * Logic:
   * - Returns the current BrowserContext that was created in createContext()
   * - Validates that context exists (guard clause)
   * - Throws error if context was never created (prevents null reference errors)
   * - Provides access to context methods for advanced operations
   * 
   * What is a Browser Context?
   * - Isolated browser session with separate cookies, localStorage, cache
   * - Container for pages (tabs) - page belongs to a context
   * - Methods include:
   *   - context.newPage() - create new tab
   *   - context.cookies() - get all cookies
   *   - context.addCookies() - add cookies manually
   *   - context.clearCookies() - clear all cookies
   *   - context.grantPermissions() - allow notifications, geolocation, etc.
   * 
   * When to use this getter?
   * - Advanced scenarios requiring context-level operations
   * - Managing multiple pages within same context
   * - Setting cookies/localStorage across pages
   * - Granting browser permissions (geolocation, notifications)
   * - Usually, you'll use getPage() for most test operations
   * 
   * @returns BrowserContext - The Playwright BrowserContext object
   * 
   * Return Value Usage (Advanced Scenarios):
   * ```typescript
   * const context = browserManager.getContext();
   * 
   * // Get all cookies from context
   * const cookies = await context.cookies();
   * 
   * // Add cookies manually (useful for pre-authentication)
   * await context.addCookies([
   *   { name: 'sessionId', value: 'token123', url: 'https://github.com' }
   * ]);
   * 
   * // Grant browser permissions
   * await context.grantPermissions(['geolocation', 'notifications']);
   * 
   * // Create multiple pages in same context
   * const page2 = await context.newPage();
   * ```
   * 
   * Prerequisites:
   * - createContext() must be called first to initialize the context
   * 
   * Throws: Error if createContext() wasn't called first (guard clause)
   * 
   * Error Scenario:
   * ```typescript
   * const browserManager = new BrowserManager();
   * const context = browserManager.getContext(); // ❌ THROWS ERROR - no context created
   * 
   * // Correct usage:
   * await browserManager.launchBrowser(scenario);
   * await browserManager.createContext();
   * const context = browserManager.getContext(); // ✅ OK - context was created
   * ```
   * 
   * Advanced Usage Example - Multiple Pages:
   * ```typescript
   * // Setup
   * await browserManager.launchBrowser(scenario);
   * await browserManager.createContext();
   * const page1 = await browserManager.createPage();
   * 
   * // Create second page in same context (shares cookies/storage)
   * const context = browserManager.getContext();
   * const page2 = await context.newPage();
   * 
   * // Both pages now share the same session/cookies
   * await page1.goto('https://github.com');
   * await page1.fill('#username', 'testuser');
   * await page2.goto('https://github.com');
   * // page2 will see testuser's session (they share context)
   * ```
   * 
   * Typical Vs Advanced Usage:
   * - Typical (95% of tests): Use getPage() for all interactions
   * - Advanced (5% of tests): Use getContext() for multi-page or session management
   */
  getContext(): BrowserContext {
    // Guard clause: Ensure context exists - prevents null reference errors
    // Throws descriptive error if context wasn't created yet
    if (!this.context) {
      throw new Error('Context not created. Call createContext() first.');
    }
    return this.context;
  }

  /**
   * Get Scenario Context - Retrieve the current test scenario context
   * 
   * Logic:
   * - Returns the CustomWorld scenario context that was stored in launchBrowser()
   * - CustomWorld contains all test data, hooks, and scenario state
   * - Validates that scenario exists (guard clause)
   * - Throws error if scenario was never stored (prevents null reference errors)
   * - Provides access to test context and shared data across all steps
   * 
   * What is Scenario Context (CustomWorld)?
   * - Custom Cucumber World object that holds test state
   * - Shared across all step definitions in same scenario
   * - Contains: BrowserManager, page objects, test data, API utilities
   * - Methods/properties include:
   *   - scenario.browserManager - reference to this BrowserManager
   *   - scenario.dataTable - data from scenario tables
   *   - scenario.attach() - attach files to test report
   *   - scenario.log() - add logs to test output
   *   - Custom properties added by test code
   * 
   * When to use this getter?
   * - Access scenario data from BrowserManager
   * - Pass scenario context between different utility classes
   * - Store and retrieve test data across steps
   * - Add logs or attachments to test reports
   * - Usually accessed in hooks or advanced utility methods
   * 
   * @returns CustomWorld - The Cucumber World containing scenario context
   * 
   * Return Value Usage:
   * ```typescript
   * // Get scenario context
   * const scenario = browserManager.getScenario();
   * 
   * // Access properties stored in scenario
   * const userId = scenario.userId;
   * const order = scenario.order;
   * 
   * // Add logs or attachments
   * scenario.attach('Test completed successfully', 'text/plain');
   * ```
   * 
   * Prerequisites:
   * - launchBrowser(scenario) must be called first with valid CustomWorld object
   * 
   * Throws: Error if launchBrowser() wasn't called first (guard clause)
   * 
   * Error Scenario:
   * ```typescript
   * const browserManager = new BrowserManager();
   * const scenario = browserManager.getScenario(); // ❌ THROWS ERROR - no scenario stored
   * 
   * // Correct usage:
   * const scenario = new CustomWorld({ ... });
   * await browserManager.launchBrowser(scenario);
   * const retrievedScenario = browserManager.getScenario(); // ✅ OK - scenario was stored
   * ```
   * 
   * Usage Example in Utility Class:
   * ```typescript
   * export class APIHelper {
   *   constructor(private browserManager: BrowserManager) {}
   *   
   *   async fetchUserData(userId: string) {
   *     const scenario = this.browserManager.getScenario();
   *     const response = await fetch(`/api/users/${userId}`);
   *     
   *     // Store data in scenario for use in steps
   *     scenario.userData = await response.json();
   *     
   *     // Add log to report
   *     scenario.attach(`User data: ${JSON.stringify(scenario.userData)}`, 'application/json');
   *   }
   * }
   * ```
   * 
   * Usage Example in Step Definitions:
   * ```typescript
   * When('user logs in with email', async function() {
   *   const page = this.browserManager.getPage();
   *   const scenario = this.browserManager.getScenario();
   *   
   *   // Use stored test data from scenario
   *   const email = scenario.testUser.email;
   *   const password = scenario.testUser.password;
   *   
   *   await page.fill('#email', email);
   *   await page.fill('#password', password);
   *   await page.click('#login-button');
   * });
   * ```
   * 
   * Usage Example for Data Sharing:
   * ```typescript
   * Given('user with email is created', async function(dataTable) {
   *   const scenario = this.browserManager.getScenario();
   *   const userData = dataTable.rowsHash();
   *   
   *   // Store data in scenario for use in later steps
   *   scenario.newUserEmail = userData.email;
   *   scenario.newUserPassword = userData.password;
   * });
   * 
   * When('user logs in with created account', async function() {
   *   const page = this.browserManager.getPage();
   *   const scenario = this.browserManager.getScenario();
   *   
   *   // Retrieve data stored in previous step
   *   await page.fill('#email', scenario.newUserEmail);
   *   await page.fill('#password', scenario.newUserPassword);
   *   await page.click('#login-button');
   * });
   * ```
   * 
   * Key Point:
   * This getter serves as a bridge between BrowserManager and the test scenario,
   * allowing different parts of test code to share state and context.
   */
  getScenario(): CustomWorld {
    // Guard clause: Ensure scenario context exists - prevents null reference errors
    // Throws descriptive error if scenario wasn't stored yet
    if (!this.scenario) {
      throw new Error('Scenario context not created.');
    }
    return this.scenario;
  }
}

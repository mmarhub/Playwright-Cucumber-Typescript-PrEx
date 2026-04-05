/**
 * Cucumber World - Test Context Container
 * 
 * The "World" is Cucumber's way of sharing data between steps in a scenario.
 * Think of it as a "backpack" that carries data throughout a test scenario.
 * 
 * Key Concepts:
 * - Each scenario gets its own World instance (isolated/thread-safe)
 * - World is accessible in step definitions via 'this'
 * - Destroyed after scenario completes
 * 
 * Why use World?
 * - Share data between steps (e.g., login data, created resources)
 * - Access page objects consistently
 * - Store scenario-specific test data
 * - Thread-safe parallel execution
 */

import { World, IWorldOptions, setWorldConstructor, setDefaultTimeout } from '@cucumber/cucumber';
import { BrowserManager } from './BrowserManager';
import { Page } from '@playwright/test';
import { GithubLoginPage } from '../pages/GithubLoginPage';
import { GithubHomePage } from '../pages/GithubHomePage';
import stripAnsi from 'strip-ansi';
import { RESTUtils } from './RESTUtils';

/**
 * CustomWorld Interface - Type-safe property definition
 * 
 * Purpose:
 * - Defines TypeScript interface for CustomWorld class
 * - Lists all properties and their types
 * - Ensures type safety and IDE autocomplete
 * - Extends Cucumber's base World interface
 * 
 * Properties Defined:
 * - browserManager: BrowserManager - Browser lifecycle management
 * - page?: Page - Playwright page (optional, set in Before hook)
 * - testData: Map<string, any> - Scenario data storage
 * - loginPage: GithubLoginPage - GitHub login page object (lazy-loaded)
 * - homePage: GithubHomePage - GitHub home page object (lazy-loaded)
 * - restUtils: RESTUtils - REST API testing utility (lazy-loaded)
 * 
 * Benefits:
 * - IDE knows about all properties (autocomplete)
 * - TypeScript catches property typos at compile time
 * - Prevents runtime errors from missing properties
 * - Makes code self-documenting
 * - Enables IntelliSense/code hints in editor
 * 
 * Extended From:
 * - Extends World from @cucumber/cucumber
 * - Inherits World's built-in methods:
 *   - this.attach() - attach data to reports
 *   - this.parameters - access Cucumber parameters
 *   - this.pickle - access current scenario data
 * 
 * Optional Properties (?):
 * - page?: Page - Optional because set lazily in Before hook
 * - Optional means can be undefined initially
 * - Set when browser/page are created
 * - Not a getter (direct property)
 * 
 * Lazy-Loaded Properties (Getters):
 * - loginPage - Created on first access via getter
 * - homePage - Created on first access via getter
 * - restUtils - Created on first access via getter
 * - Use get keyword to automatically invoke on access
 * 
 * Usage in Code:
 * ```typescript
 * // TypeScript knows these properties exist
 * function myStep(world: ICustomWorld) {
 *   world.browserManager;  // ✅ Known property
 *   world.loginPage;       // ✅ Known property (getter)
 *   world.testData;        // ✅ Known property
 *   world.unknownProp;     // ❌ ERROR - unknown property
 * }
 * ```
 * 
 * Property Availability Timeline:
 * - Constructor: browserManager (✅), testData (✅), page (❌ optional)
 * - Before hook: all page properties available
 * - Steps: all properties available as called
 * - Never: properties remain accessible until scenario ends
 * 
 * Adding New Properties:
 * 1. Add to ICustomWorld interface
 * 2. Add to CustomWorld class
 * 3. Initialize in constructor or as getter
 * 4. Now available in all step definitions
 * 
 * Example Extension:
 * ```typescript
 * export interface ICustomWorld extends World {
 *   // ... existing properties ...
 *   apiHelper: APIHelper; // New property
 * }
 * 
 * export class CustomWorld extends World implements ICustomWorld {
 *   // ... existing properties ...
 *   private _apiHelper?: APIHelper;
 *   
 *   get apiHelper(): APIHelper {
 *     if (!this._apiHelper) {
 *       this._apiHelper = new APIHelper();
 *     }
 *     return this._apiHelper;
 *   }
 * }
 * ```
 */
export interface ICustomWorld extends World {
  browserManager: BrowserManager;       // Manages browser lifecycle
  page?: Page;                          // Playwright page object (optional initially)
  testData: Map<string, any>;           // Store scenario-specific test data
  loginPage: GithubLoginPage;           // Login page object (lazy-loaded getter)
  homePage: GithubHomePage;             // Home page object (lazy-loaded getter)

  // For API Testing
  restUtils: RESTUtils;                 // REST API utility instance (lazy-loaded getter)
}

/**
 * Cucumber Test Timeout Configuration
 * 
 * Logic:
 * - Sets global timeout for all async hooks and steps
 * - If any hook/step takes longer than timeout, test fails
 * - Prevents tests from hanging indefinitely
 * 
 * Default vs Custom:
 * - Default: 5000 milliseconds (5 seconds) - very short
 * - Custom: 60 * 1000 = 60000 milliseconds (60 seconds) - UI/API testing
 * 
 * Why Increase?
 * - Browser startup takes 5-15 seconds (exceeds default 5s)
 * - Page navigation and loading takes time
 * - API requests can be slow
 * - DB operations take time
 * - Default 5s timeout too aggressive for realistic tests
 * 
 * When Timeout Occurs:
 * - Step takes longer than 60 seconds
 * - Cucumber kills the test with TimeoutError
 * - Test marked as FAILED
 * - Error: "function timed out"
 * - Test output shows which step timed out
 * 
 * Timeout Error Message:
 * "function timed out, ensure the promise resolves within 60000 milliseconds"
 * 
 * Examples That Exceed 60s:
 * - Browser launch while system is slow
 * - Heavy page with lots of elements
 * - Slow network (real devices)
   * - Database query with lots of data
   * - External API calls that are slow
   * 
   * Affects:
   * - All Before hooks
   * - All Given/When/Then steps
   * - All After hooks
   * - Any async function called from steps
   * 
   * Note:
   * - Page.setDefaultTimeout (in BrowserManager) is different
   * - BrowserManager timeout: for individual page actions
   * - setDefaultTimeout (this): for whole step/hook
   * - Both can timeout independently
   * 
   * Debug Tips:
   * - If step takes 70s, increase to 90s
   * - Add step logs to identify slow steps
   * - Use attachClean() to log progress
   * - Profile slow tests to find bottlenecks
   * 
   * Recommendation:
   * - 60s is good for most UI tests
   * - 30s for API-only tests (faster)
   * - 120s+ for integration tests (slow)
   * - Add attachClean() calls to debug timeouts
   */
setDefaultTimeout(60 * 1000);

/**
 * CustomWorld Class - Test scenario context container
 * 
 * Implementation of ICustomWorld interface
 * Instantiated ONCE per scenario
 * 
 * What is CustomWorld?
 * - Cucumber's way of sharing data between step definitions
 * - Each scenario gets its own CustomWorld instance
 * - Available as 'this' in all step definitions for that scenario
 * - Destroyed when scenario completes
 * - Thread-safe: Multiple scenarios can run with unique World instances
 * 
 * Core Responsibilities:
 * 1. Manage browser lifecycle (browserManager)
 * 2. Store scenario-specific test data (testData Map)
 * 3. Provide page objects for UI testing (loginPage, homePage getters)
 * 4. Provide REST API utility (restUtils getter)
 * 5. Attach data/logs to test reports (attach, attachClean methods)
 * 
 * Lifecycle:
 * 1. Scenario starts
 * 2. CustomWorld() constructor runs
 *    - Initializes browserManager
 *    - Initializes testData Map ()
 *    - Other properties remain undefined (lazy)
 * 3. Before hooks execute
 *    - Launch browser via browserManager
 *    - Create browser context
 *    - Create page/tab
 * 4. Given/When/Then steps execute
 *    - Access this.browserManager, this.testData, this.loginPage, etc.
 *    - Store/retrieve data in testData Map
 *    - Interact with page objects
 *    - Call API methods
 * 5. After hooks execute
 *    - Close browser
 *    - Dispose resources
 * 6. CustomWorld destroyed (garbage collected)
 *    - Memory released
 *    - Next scenario gets fresh CustomWorld instance
 * 
 * Public Properties (Direct Access):
 * - browserManager: BrowserManager
 *   - Initialized in constructor
 *   - Access via this.browserManager
 *   - Manages browser launch/close
 * 
 * - page?: Page (optional)
 *   - Set in Before hook
 *   - May be undefined initially
 *   - Access via this.page (direct property, not getter)
 *   - Use this.browserManager.getPage() for validation
 * 
 * - testData: Map<string, any>
 *   - Initialized in constructor as empty Map
 *   - Access via this.testData
 *   - Store: this.testData.set('key', value)
 *   - Retrieve: this.testData.get('key')
 * 
 * Lazy-Loaded Properties (Getters):
 * - loginPage: GithubLoginPage (getter)
 *   - Created on first access: this.loginPage
 *   - Subsequent accesses return cached instance
 *   - Used for GitHub login workflows
 * 
 * - homePage: GithubHomePage (getter)
 *   - Created on first access: this.homePage
 *   - Subsequent accesses return cached instance
 *   - Used for GitHub homepage workflows
 * 
 * - restUtils: RESTUtils (getter)
 *   - Created on first access: this.restUtils
 *   - Subsequent accesses return cached instance
 *   - Used for REST API testing
 * 
 * Private Properties (Internal Caching):
 * - _loginPage?: GithubLoginPage
 *   - Private (only used internally)
 *   - Cache for loginPage getter
 *   - Undefined until first access
 * 
 * - _homePage?: GithubHomePage
 *   - Private (only used internally)
 *   - Cache for homePage getter
 *   - Undefined until first access
 * 
 * - _restUtils?: RESTUtils
 *   - Private (only used internally)
 *   - Cache for restUtils getter
 *   - Undefined until first access
 * 
 * Methods Available:
 * - constructor(options) - Initialize new World
 * - attachClean(data, mediaType) - Attach cleaned logs to reports
 * - loginPage (getter) - Access login page object
 * - homePage (getter) - Access home page object
 * - restUtils (getter) - Access API utility
 * 
 * Inherited Methods from Cucumber World:
 * - this.attach(data, mediaType) - Attach data to reports
 * - this.parameters - Access Cucumber parameters
 * - this.pickle - Access current scenario details
 * 
 * Usage Patterns:
 * 
 * Pattern 1 - Store and Retrieve Test Data:
 * ```typescript
 * Given('user credentials', function(dataTable) {
 *   const data = dataTable.rowsHash();
 *   this.testData.set('username', data.username);
 *   this.testData.set('password', data.password);
 * });
 * 
 * When('user logs in', async function() {
 *   const username = this.testData.get('username');
 *   const password = this.testData.get('password');
 *   await this.loginPage.login(username, password);
 * });
 * ```
 * 
 * Pattern 2 - Use Page Objects:
 * ```typescript
 * Given('user on homepage', async function() {
 *   await this.homePage.navigateToHomepage();
 * });
 * 
 * When('user clicks button', async function() {
 *   await this.homePage.clickButton();
 * });
 * ```
 * 
 * Pattern 3 - API Testing:
 * ```typescript
 * When('request API data', async function() {
 *   await this.restUtils.setupOAuthRequest();
 *   const response = await this.restUtils.getOAuthToken(id, secret);
 * });
 * 
 * Then('verify response', async function() {
 *   const status = await this.restUtils.getResponseStatusCode();
 *   expect(status).toBe(200);
 * });
 * ```
 * 
 * Pattern 4 - Log to Reports:
 * ```typescript
 * When('operation completes', async function() {
 *   const result = await expensiveOperation();
 *   this.attachClean(JSON.stringify(result), 'application/json');
 * });
 * ```
 * 
 * Memory Efficiency:
 * - browserManager: Always created (lightweight)
 * - testData: Starts empty, grows as needed
 * - loginPage: Created only if accessed
 * - homePage: Created only if accessed
 * - restUtils: Created only if accessed
 * - Total memory depends on test needs
 * 
 * Thread Safety:
 * - Each scenario gets unique CustomWorld instance
 * - No shared state between scenarios
 * - Multiple scenarios can run in parallel
 * - testData is unique per scenario
 * - Page objects are unique per scenario
 * - Safe for distributed/parallel execution
 * 
 * Extension Pattern:
 * To add new utilities/properties:
 * ```typescript
 * // 1. Update interface
 * export interface ICustomWorld extends World {
 *   myHelper: MyHelper; // Add getter
 * }
 * 
 * // 2. Add private property
 * export class CustomWorld extends World implements ICustomWorld {
 *   private _myHelper?: MyHelper;
 *   
 *   // 3. Add lazy-loading getter
 *   get myHelper(): MyHelper {
 *     if (!this._myHelper) {
 *       this._myHelper = new MyHelper();
 *     }
 *     return this._myHelper;
 *   }
 * }
 * ```
 * 
 * Testing Tips:
 * - Use testData.set() in Given steps for test data
 * - Use testData.get() in When/Then steps to access data
 * - Use attachClean() to debug test execution
 * - Use page objects for all UI interactions
 * - Use restUtils for all API calls
 * - Store API responses in testData for validation
 */
export class CustomWorld extends World implements ICustomWorld {
  /**
   * PUBLIC PROPERTIES
   * Directly accessible in step definitions as this.browserManager, this.testData
   * Initialized in constructor - always exist
   */

  /**
   * Browser Manager Instance
   * Manages: browser launch, context creation, page creation, cleanup
   * Initialized: In constructor
   * Lifecycle: One per scenario
   * Access: this.browserManager
   */
  browserManager: BrowserManager;

  /**
   * Playwright Page Object
   * Represents: Current browser tab/page
   * Initialized: In Before hook (via browserManager.createPage())
   * Optional: May be undefined before Before hook (before browser created)
   * Access: this.page (or use this.browserManager.getPage() for validation)
   */
  page?: Page;

  /**
   * Scenario Test Data Storage
   * Purpose: Store/retrieve data shared between steps
   * Type: Map for efficient dynamic key-value storage
   * Initialized: Empty Map in constructor
   * Access: this.testData.set(key, value) and this.testData.get(key)
   * 
   * Usage:
   * - Store: this.testData.set('username', 'john@example.com')
   * - Retrieve: this.testData.get('username')
   * - Check: this.testData.has('username')
   * - Delete: this.testData.delete('username')
   * - Clear: this.testData.clear()
   * - Size: this.testData.size
   * - Iterate: this.testData.forEach((value, key) => { ... })
   */
  testData: Map<string, any>;

  /**
   * PRIVATE PROPERTIES
   * Used internally for caching lazy-loaded page objects
   * Underscore prefix: Private by convention
   * Optional (?): Undefined until first getter access
   */

  /**
   * Cache for loginPage getter
   * Private - Do NOT access directly
   * Use: this.loginPage (getter) instead
   */
  private _loginPage?: GithubLoginPage;

  /**
   * Cache for homePage getter
   * Private - Do NOT access directly
   * Use: this.homePage (getter) instead
   */
  private _homePage?: GithubHomePage;

  /**
   * Cache for restUtils getter
   * Private - Do NOT access directly
   * Use: this.restUtils (getter) instead
   */
  private _restUtils?: RESTUtils;

  /**
   * Constructor - Initialize World instance for new scenario
   * 
   * Logic:
   * - Called ONCE at the beginning of each scenario
   * - Calls parent World constructor for Cucumber initialization
   * - Creates new BrowserManager instance (one per scenario, isolated)
   * - Creates empty Map for storing scenario-specific test data
   * - This constructor runs BEFORE any step definitions or hooks execute
   * 
   * Lifecycle:
   * 1. Test framework creates new CustomWorld() instance
   * 2. Constructor initializes browserManager and testData
   * 3. Before hooks execute (e.g., launch browser)
   * 4. Given/When/Then step definitions execute
   * 5. After hooks execute (e.g., close browser)
   * 6. CustomWorld instance is destroyed (garbage collected)
   * 
   * Thread Safety:
   * - Each scenario gets its own World instance
   * - Multiple scenarios can run in parallel without conflicts
   * - browserManager is unique per scenario
   * - testData Map is unique per scenario
   * 
   * @param options - IWorldOptions from Cucumber
   *   Contains: timeout, parameters, attach() method, etc.
   * 
   * Return: void - No return value, just initialization
   * 
   * Side Effects:
   * - initializes this.browserManager with new BrowserManager()
   * - Initializes this.testData with empty Map
   * - Page objects (loginPage, homePage) created lazily (on first access)
   * - RESTUtils instance created lazily (on first access)
   * 
   * Usage Example (Implicit - Cucumber manages this):
   * ```typescript
   * // Cucumber internally does this at scenario start:
   * const world = new CustomWorld({ attach: attachFn, parameters: {}, timeout: 60000 });
   * // Now 'world' is available as 'this' in step definitions
   * 
   * Given('user starts the browser', async function() {
   *   // 'this' IS the CustomWorld instance
   *   // this.browserManager is initialized in constructor
   *   await this.browserManager.launchBrowser(this);
   * });
   * ```
   * 
   * What NOT to do:
   * - DON'T manually create CustomWorld - Cucumber handles this
   * - DON'T call constructor multiple times - it's called once per scenario
   * - DON'T store heavy objects in constructor (use lazy getters instead)
   * 
   * Memory Efficiency:
   * - browserManager is created even if browser isn't used
   * - testData Map starts empty, grows as needed
   * - Page objects created only when accessed (lazy initialization)
   * - RESTUtils created only when accessed (lazy initialization)
   */
  constructor(options: IWorldOptions) {
    // Call parent World constructor - initializes Cucumber World functionality
    // This enables access to this.attach(), this.parameters, etc.
    super(options);

    // Initialize browser manager - creates new instance for this scenario
    // One BrowserManager per scenario ensures test isolation
    // Not initialized until explicitly used in hooks
    this.browserManager = new BrowserManager();

    // Initialize test data storage using Map data structure
    // Map is better than plain object for dynamic key-value storage:
    // - Better performance for frequent add/get/delete operations
    // - Can use any type as key (not just strings)
    // - Built-in iteration methods (forEach, entries, values)
    // - Can store Map and Set as values (nested structures)
    this.testData = new Map<string, any>();
  }

  /**
   * Attach Clean Data - Attach text to test report, removing ANSI color codes
   * 
   * Logic:
   * - Receives data (typically text) to attach to test report
   * - If data is a string, removes ANSI color codes using stripAnsi()
   * - Converts cleaned data to appropriate format
   * - Attaches to Cucumber report with specified media type
   * 
   * What are ANSI Color Codes?
   * - ANSI codes are special characters that add colors to terminal output
   * - Example: '\x1b[32m' = green, '\x1b[31m' = red, '\x1b[0m' = reset
   * - Used by console.log(), colored logs from libraries, CLI tools
   * - Look like: 'Test \x1b[32mpassed\x1b[0m' (green "passed" text)
   * 
   * Why Strip ANSI Codes?
   * - Reports and logs sometimes show raw ANSI codes as weird characters
   * - Humans can't read raw ANSI codes in reports
   * - Stripping makes output clean and readable in HTML/JSON reports
   * - Some report viewers don't support ANSI codes natively
   * 
   * @param data - Any data to attach (usually string with color codes)
   *   - Can be console output, log messages, error text, etc.
   * @param mediaType - MIME type for report viewer (default: 'text/plain')
   *   - 'text/plain' - plain text (most common)
   *   - 'application/json' - JSON data (formatted)
   *   - 'text/html' - HTML content (rendered)
   *   - 'image/png' - screenshot image
   *   - 'image/jpeg' - JPEG image
   * 
   * Return: any - Returns result of attach() call (varies by test framework)
   * 
   * Side Effects:
   * - Attaches data to Cucumber report/output
   * - Report can be viewed in JSON report, HTML report, or test output
   * - Data appears in test run logs/reports for debugging
   * 
   * Throws: No exceptions - handles any input gracefully
   * 
   * Prerequisites:
   * - World instance must be created (happens automatically)
   * - stripAnsi library must be imported
   * 
   * Usage Example - Attaching Console Output:
   * ```typescript
   * When('user performs expensive operation', async function() {
   *   const result = await page.evaluate(() => {
   *     console.log('Result: \x1b[32mcalculating...\x1b[0m'); // green text
   *     return complexFunction();
   *   });
   *   
   *   // ANSI codes removed automatically
   *   this.attachClean(result, 'text/plain');
   *   // Report shows: "Result: calculating..." (no weird characters)
   * });
   * ```
   * 
   * Usage Example - Attaching Error Information:
   * ```typescript
   * When('user performs operation', async function() {
   *   try {
   *     await page.click('#not-found');
   *   } catch (error) {
   *     // Error message often has ANSI codes from stack trace
   *     this.attachClean(error.message, 'text/plain');
   *     throw error; // Re-throw to fail test
   *   }
   * });
   * ```
   * 
   * Usage Example - Attaching JSON Response:
   * ```typescript
   * When('API returns response', async function() {
   *   const response = await fetch('/api/data');
   *   const json = await response.json();
   *   
   *   this.attachClean(
   *     JSON.stringify(json, null, 2), // Pretty-printed JSON
   *     'application/json' // Tell viewer it's JSON
   *   );
   * });
   * ```
   * 
   * Usage Example - Attaching Log Data:
   * ```typescript
   * After(async function(scenario) {
   *   const logs = await this.page.evaluate(() => console.log);
   *   this.attachClean(logs, 'text/plain');
   * });
   * ```
   * 
   * Technical Details:
   * - stripAnsi() uses regex to find and remove ANSI escape sequences
   * - Only processes strings (other data types passed as-is)
   * - If data isn't a string, it's attached without stripping
   * - attach() is Cucumber's method for adding to reports
   * 
   * When to Use:
   * - Attaching console/terminal output with colors
   * - Debugging failed tests with logs
   * - Recording important test data for analysis
   * - Capturing error messages for troubleshooting
   * 
   * When NOT to Use:
   * - For attachments that already have ANSI codes removed
   * - For images/binary data (use appropriate mediaType)
   * - For already-formatted HTML (mediaType 'text/html')
   */
  attachClean(data: any, mediaType: string = 'text/plain') {
    // Initialize 'cleaned' variable with original data
    let cleaned = data;

    // Check if data is a string (has ANSI codes to strip)
    if (typeof data === 'string') {
      // Remove ANSI color/formatting codes from string
      // stripAnsi replaces all ANSI escape sequences with empty string
      // Example: 'Test \x1b[32mpassed\x1b[0m' -> 'Test passed'
      cleaned = stripAnsi(data);
    }

    // Attach cleaned data to Cucumber report with specified media type
    // Report viewers will use mediaType hint to format the output
    // Returns the attachment identifier (used internally by Cucumber)
    return this.attach(cleaned, mediaType);
  }

  /**
   * Login Page Getter - Access GitHub login page object (Lazy Initialization)
   * 
   * Logic:
   * - This is a getter - accessed like property (this.loginPage) but executes code
   * - First access: Creates GithubLoginPage instance and caches it
   * - Subsequent accesses: Returns cached instance (no recreation)
   * - Validates browser/page is initialized before creating page object
   * - Throws error if page not ready (Before hook not run)
   * 
   * What is a Getter?
   * - Special TypeScript/JavaScript feature - method that looks like property
   * - Syntax: get loginPage() { ... }
   * - Usage: this.loginPage (NOT this.loginPage())
   * - Executes getter code transparently when accessed
   * 
   * Lazy Initialization Pattern:
   * - Page object created ONLY when first accessed
   * - Before first access: _loginPage is undefined (not created)
   * - After first access: _loginPage is cached and reused
   * - Subsequent accesses return same instance
   * - Benefits:
   *   - Memory efficiency (don't create unused pages)
   *   - Performance (no unnecessary initialization)
   *   - Browser is ready (page created after Before hooks)
   *   - Flexible (can use different pages in different tests)
   * 
   * Why Lazy?
   * - Not all scenarios need login page (some test homepage directly)
   * - Page objects require initialized browser (created in Before hook)
   * - If created in constructor, browser might not be ready yet
   * - Lazy approach ensures page created at right time
   * 
   * Private vs Public:
   * - _loginPage (PRIVATE with underscore) - internal caching
   * - loginPage (PUBLIC getter) - what steps access
   * - This encapsulates the caching mechanism
   * 
   * Guard Clause:
   * - Checks if this.browserManager.getPage() returns valid page
   * - Throws error if page not found (browser not initialized)
   * - Error message tells user to ensure Before hook has run
   * - Prevents confusing undefined errors later in page object
   * 
   * Non-null Assertion (!):
   * - this.browserManager! tells TypeScript "I'm sure this is not null"
   * - TypeScript would otherwise complain browserManager could be undefined
   * - We're sure it's not null because constructor initializes it
   * 
   * @returns GithubLoginPage - Page object for login interactions
   * 
   * Return Value:
   * - GithubLoginPage instance with all page methods available
   * - Same instance returned on subsequent accesses (cached)
   * - Can be used for multiple steps without recreation
   * 
   * Side Effects:
   * - First access: Creates new GithubLoginPage instance
   * - First access: Caches in _loginPage private property
   * - Subsequent accesses: Returns cached instance (no side effects)
   * - No browser state changes (just creates wrapper object)
   * 
   * Throws: Error if page not initialized (Before hook not run)
   * 
   * Prerequisites (MUST run in order):
   * 1. Constructor runs (initializes browserManager)
   * 2. Before hook runs (launches browser, creates page)
   * 3. THEN: Step can call this.loginPage for first time
   * 
   * Lifecycle:
   * - Scenario starts, CustomWorld created
   * - Before hook launches browser via browserManager
   * - First step calls this.loginPage
   * - Getter checks if browser ready (throws if not)
   * - Getter creates GithubLoginPage instance
   * - GithubLoginPage instance cached
   * - Step executes page methods
   * - Subsequent steps reuse same cached instance
   * - After hook closes browser
   * - CustomWorld destroyed (garbage collected)
   * 
   * Usage Example - Simple Login:
   * ```typescript
   * Given('user navigates to login page', async function() {
   *   // First access to this.loginPage triggers getter
   *   // Getter creates GithubLoginPage instance and caches
   *   await this.loginPage.navigateToLoginPage();
   * });
   * 
   * When('user enters credentials', async function() {
   *   // Second access to this.loginPage returns cached instance
   *   // No recreation or redundant initialization
   *   await this.loginPage.enterUsername(this.testData.get('username'));
   *   await this.loginPage.enterPassword(this.testData.get('password'));
   * });
   * 
   * When('user clicks login', async function() {
   *   // Third access - still uses cached instance
   *   await this.loginPage.clickLoginButton();
   * });
   * ```
   * 
   * Usage Example - Multi-step with Stored Data:
   * ```typescript
   * Given('stored GitHub credentials', async function(dataTable) {
   *   const data = dataTable.rowsHash();
   *   // Store in testData Map for use in later steps
   *   this.testData.set('username', data.email);
   *   this.testData.set('password', data.password);
   * });
   * 
   * When('user logs in', async function() {
   *   // Access stored data and use with page object
   *   await this.loginPage.navigateToLoginPage();
   *   await this.loginPage.login(
   *     this.testData.get('username'),
   *     this.testData.get('password')
   *   );
   * });
   * 
   * Then('user is logged in', async function() {
   *   // Same page object instance used across all steps
   *   expect(await this.loginPage.isLoggedIn()).toBe(true);
   * });
   * ```
   * 
   * Under the Hood:
   * ```typescript
   * // First call: this.loginPage
   * if (!this._loginPage) {  // _loginPage undefined, so create
   *   this._loginPage = new GithubLoginPage(this.browserManager);
   * }
   * return this._loginPage; // Returns new instance
   * 
   * // Second call: this.loginPage
   * if (!this._loginPage) {  // _loginPage exists now, so skip creation
   *   this._loginPage = new GithubLoginPage(this.browserManager); // SKIP
   * }
   * return this._loginPage; // Returns SAME cached instance
   * ```
   * 
   * Error Scenarios:
   * 1. Missing Before hook:
   *    ```typescript
   *    // If Before hook never runs:
   *    When('user tries to login', async function() {
   *      await this.loginPage.login(...); // THROWS: Page is not initialized
   *    });
   *    ```
   * 
   * 2. Browser closed prematurely:
   *    ```typescript
   *    When('browser already closed', async function() {
   *      await this.browserManager.closeBrowser(); // Closes browser too early
   *      await this.loginPage.navigate(); // THROWS: Page is not initialized
   *    });
   *    ```
   * 
   * Performance Tip:
   * - First access has small overhead (object creation)
   * - All subsequent accesses are O(1) - instant property return
   * - In 100-step scenario, only first step pays the cost
   * 
   * Best Practice:
   * - Use this.loginPage freely - it's efficient
   * - Let getter handle caching automatically
   * - Don't manually cache page object (unnecessary)
   * - Let different page getters handle their own caching
   */
  get loginPage(): GithubLoginPage {
    // If loginPage doesn't exist yet (first access), create it
    if (!this._loginPage) {
      // Guard clause: Ensure browser page is initialized
      // Checks if browserManager has successfully created a page
      // Throws error if Before hook hasn't run or page creation failed
      if (!this.browserManager.getPage()) {
        throw new Error('Page is not initialized. Ensure Before hook has run.');
      }

      // Create new GithubLoginPage instance for this scenario
      // Pass browserManager so page object can access page and navigate
      // Non-null assertion (!) tells TypeScript browserManager is not null
      // We know it's not null because constructor initializes it
      this._loginPage = new GithubLoginPage(this.browserManager!);
    }

    // Return cached instance for subsequent accesses
    // All steps reuse same page object throughout scenario
    // Avoids reinitializing page object multiple times
    return this._loginPage;
  }

  /**
   * Home Page Getter - Access GitHub home page object (Lazy Initialization)
   * 
   * Logic:
   * - Same lazy initialization pattern as loginPage getter
   * - First access: Creates GithubHomePage instance and caches
   * - Subsequent accesses: Returns cached instance (no recreation)
   * - Validates browser/page is initialized (guard clause)
   * - Throws error if page not ready
   * 
   * Lazy Initialization Pattern (Same as loginPage):
   * - Page object created ONLY on first access
   * - Subsequent accesses return cached instance
   * - Memory efficient (no unused pages created)
   * - Performance efficient (initialization happens once)
   * - Browser is guaranteed to be ready (After Before hook)
   * 
   * Why Both loginPage and homePage?
   * - Different scenarios test different pages
   * - Login flows use loginPage
   * - Homepage flows use homePage
   * - Pricing page flows use homePage
   * - Lazy loading optimizes for each scenario's needs
   * 
   * Return Caching:
   * - First step: Creates GithubHomePage, stores in _homePage
   * - Second step: Finds _homePage exists, returns it immediately
   * - Tenth step: Still returns same _homePage instance
   * - Ensures consistent page state throughout scenario
   * 
   * @returns GithubHomePage - Page object for homepage interactions
   * 
   * Return Value:
   * - GithubHomePage instance with all homepage methods
   * - Methods like: navigateToHomepage(), getPageTitle(), etc.
   * - Same cached instance for all subsequent accesses
   * 
   * Side Effects:
   * - First access: Creates GithubHomePage instance
   * - First access: Caches in _homePage private property
   * - Subsequent accesses: No side effects, just returns cached instance
   * 
   * Throws: Error if page not initialized (Before hook didn't run)
   * 
   * Prerequisites:
   * 1. CustomWorld constructor runs
   * 2. Before hook runs (launches browser, creates page)
   * 3. Step calls this.homePage
   * 
   * Usage Example - Verify Homepage:
   * ```typescript
   * Given('user navigates to GitHub homepage', async function() {
   *   // First access - creates GithubHomePage instance
   *   await this.homePage.navigateToHomepage();
   * });
   * 
   * Then('homepage displays correctly', async function() {
   *   // Subsequent access - uses cached instance
   *   const title = await this.homePage.getPageTitle();
   *   expect(title).toContain('GitHub');
   * });
   * 
   * Then('user can see pricing link', async function() {
   *   // Still using same cached instance
   *   const hasPricingLink = await this.homePage.hasPricingLink();
   *   expect(hasPricingLink).toBe(true);
   * });
   * ```
   * 
   * Usage Example - Page Transitions:
   * ```typescript
   * Given('user on homepage', async function() {
   *   await this.homePage.navigateToHomepage();
   * });
   * 
   * When('user clicks pricing link', async function() {
   *   // Same page, navigate within it
   *   await this.homePage.clickPricingLink();
   * });
   * 
   * Then('pricing page loads', async function() {
   *   // Page object may track new URL but same instance
   *   const url = await this.homePage.getCurrentUrl();
   *   expect(url).toContain('/pricing');
   * });
   * ```
   * 
   * Usage Example - Multi-scenario:
   * ```typescript
   * // Scenario 1: Test homepage
   * Given('user on homepage', async function() {
   *   await this.homePage.navigateToHomepage(); // Creates homePage
   * });
   * // Scenario 1 ends, CustomWorld destroyed
   * 
   * // Scenario 2: Different test
   * Given('user on pricing page', async function() {
   *   await this.homePage.navigateToHomepage(); // NEW homePage created
   *   // Different instance from Scenario 1 (different CustomWorld)
   * });
   * ```
   * 
   * Difference from loginPage:
   * - loginPage: For login/authentication flows
   * - homePage: For general GitHub homepage exploration
   * - Both use same lazy initialization pattern
   * - Both cached within scenario
   * - Both created with same BrowserManager
   * - Both destroyed when scenario ends
   * 
   * Guard Clause Explanation:
   * - Checks this.browserManager.getPage() is not null
   * - If null, Before hook either:
   *   - Didn't run (test setup issue)
   *   - Failed (browser launch failed)
   *   - Was skipped (test configuration issue)
   * - Error message guides user to fix missing Before hook
   * 
   * Non-null Assertion (!):
   * - this.browserManager! tells TypeScript "definitely not null"
   * - Constructor initializes browserManager, so it's never null
   * - Suppresses TypeScript's strict null safety
   * - We're confident due to initialization timing
   * 
   * Performance Characteristics:
   * - First access: O(n) where n = GithubHomePage creation time
   * - Subsequent accesses: O(1) - instant property lookup
   * - Most scenarios: seconds-level cost once, then instant
   * 
   * Thread Safety:
   * - Each scenario gets unique CustomWorld instance
   * - Each CustomWorld gets unique _homePage instance (when created)
   * - Multiple scenarios can have different homePage instances
   * - No shared state between scenarios
   * - Safe for parallel test execution
   * 
   * Caching Mechanism:
   * ```typescript
   * // Under the hood:
   * get homePage(): GithubHomePage {
   *   if (!this._homePage) {                    // Check cache
   *     if (!this.browserManager.getPage()) {  // Validate browser ready
   *       throw new Error(...);                 // Guard clause
   *     }
   *     this._homePage = new GithubHomePage(...); // Create & cache
   *   }
   *   return this._homePage;                    // Return from cache
   * }
   * 
   * // Call sequence:
   * First call:  if (!undefined) -> true -> CREATE -> store in _homePage
   * Second call: if (!GithubHomePage) -> false -> SKIP -> return cached
   * Third call:  if (!GithubHomePage) -> false -> SKIP -> return cached
   * ```
   */
  get homePage(): GithubHomePage {
    // If homePage doesn't exist yet (first access), create it
    if (!this._homePage) {
      // Guard clause: Ensure page is initialized in browser
      // Same validation as loginPage getter
      if (!this.browserManager.getPage()) {
        throw new Error('Page is not initialized. Ensure Before hook has run.');
      }

      // Create and cache GithubHomePage instance for this scenario
      // Pass BrowserManager so page object can access page and methods
      // Non-null assertion (!) - browserManager initialized in constructor
      this._homePage = new GithubHomePage(this.browserManager!);
    }

    // Return cached instance for all subsequent accesses
    // Same instance reused throughout scenario
    return this._homePage;
  }

  /**
   * REST Utilities Getter - Access API testing utility (Lazy Initialization)
   * 
   * Logic:
   * - Lazy initialization pattern for REST API testing utility
   * - First access: Creates RESTUtils instance and caches it
   * - Subsequent accesses: Returns cached instance (no recreation)
   * - No browser/page validation needed (API tests don't need browser)
   * - Does not throw errors (inherent dependency check not needed)
   * 
   * Lazy Initialization Pattern:
   * - RESTUtils instance created ONLY on first access
   * - Subsequent accesses return cached instance
   * - Memory efficient (no unused API utilities created)
   * - Performance efficient (no redundant initialization)
   * - Enables both UI and API testing in same scenario
   * 
   * Key Difference from Page Getters:
   * - Page getters require browser (need guard clause)
   * - RESTUtils doesn't need browser (works independently)
   * - Page getters validate Page is initialized
   * - RESTUtils doesn't need validation
   * - Can be used without browser (headless API tests)
   * - Can be used with browser (integration tests)
   * 
   * What is RESTUtils?
   * - Utility class for REST API testing
   * - Handles: OAuth tokens, HTTP requests (GET, POST, PUT, PATCH, DELETE)
   * - Methods: setupOAuthRequest(), postTransaction(), getResponseBody(), etc.
   * - Manages APIRequestContext from Playwright
   * 
   * Use Cases:
   * - OAuth authentication workflows
   * - PayPal transaction API calls
   * - Response validation
   * - Negative test cases
   * - API-only scenarios (no UI testing)
   * - Integration tests (UI + API validation)
   * 
   * @returns RESTUtils - API testing utility instance
   * 
   * Return Value:
   * - RESTUtils instance with all API methods available
   * - Methods for: setup, requests, response parsing, cleanup
   * - Same cached instance for all subsequent accesses
   * 
   * Side Effects:
   * - First access: Creates RESTUtils instance
   * - First access: Caches in _restUtils private property
   * - Subsequent accesses: No side effects, returns cached instance
   * - No network calls until explicit API methods called
   * 
   * Throws: No exceptions from getter
   * - RESTUtils methods may throw later (in step definitions)
   * 
   * Prerequisites:
   * - CustomWorld constructor runs (to initialize this)
   * - No other dependencies for getter itself
   * - May need setup steps before API calls (setupOAuthRequest, etc.)
   * 
   * Usage Example - Pure API Test:
   * ```typescript
   * Given('OAuth credentials are set', async function() {
   *   this.testData.set('clientId', 'my-client-id');
   *   this.testData.set('clientSecret', 'my-secret');
   * });
   * 
   * When('request OAuth token', async function() {
   *   // First access - creates RESTUtils instance
   *   await this.restUtils.setupOAuthResourceURL('login/oauth/access_token');
   *   await this.restUtils.setupOAuthRequest();
   *   
   *   const response = await this.restUtils.getOAuthToken(
   *     this.testData.get('clientId'),
   *     this.testData.get('clientSecret')
   *   );
   * });
   * 
   * Then('token received', async function() {
   *   // Subsequent access - uses cached instance
   *   const statusCode = await this.restUtils.getResponseStatusCode();
   *   expect(statusCode).toBe(200);
   *   
   *   const body = await this.restUtils.getResponseBody();
   *   expect(body).toHaveProperty('access_token');
   * });
   * ```
   * 
   * Usage Example - Transaction API Test:
   * ```typescript
   * Given('payment payload prepared', async function() {
   *   const payload = {
   *     orderID: '123',
   *     action: 'CAPTURE',
   *     amount: { value: '100.00', currency_code: 'USD' }
   *   };
   *   this.testData.set('payload', payload);
   * });
   * 
   * When('POST transaction', async function() {
   *   // Setup API context
   *   await this.restUtils.setupTranResourceURL('/v2/checkout/orders');
   *   await this.restUtils.setupTranRequest();
   *   
   *   // Set request body and headers
   *   await this.restUtils.setAPIBodyPayload(this.testData.get('payload'));
   *   const headers = { 'Authorization': `Bearer ${token}` };
   *   await this.restUtils.setAPICustomHeaders(headers);
   *   
   *   // Make request
   *   const response = await this.restUtils.postTransaction();
   * });
   * 
   * Then('transaction successful', async function() {
   *   // Reuse same cached RESTUtils instance
   *   const statusCode = await this.restUtils.getResponseStatusCode();
   *   expect(statusCode).toBe(201);
   * });
   * ```
   * 
   * Usage Example - Integration Test (UI + API):
   * ```typescript
   * Given('user navigates to app', async function() {
   *   // Use browser (page getter)
   *   await this.homePage.navigateToHomepage();
   * });
   * 
   * When('user triggers API action', async function() {
   *   // Click button that makes API request
   *   await this.homePage.clickActionButton();
   *   
   *   // Then verify via API
   *   // Get token from local storage (UI)
   *   const token = await this.homePage.getStoredToken();
   *   
   *   // Use token for API call (API)
   *   const headers = { 'Authorization': `Bearer ${token}` };
   *   await this.restUtils.setAPICustomHeaders(headers);
   *   await this.restUtils.setupTranResourceURL('/api/status');
   *   await this.restUtils.setupTranRequest();
   *   const response = await this.restUtils.getTransaction();
   * });
   * 
   * Then('API confirms success', async function() {
   *   // Verify via API response
   *   const status = await this.restUtils.getResponseBody();
   *   expect(status.success).toBe(true);
   * });
   * ```
   * 
   * Usage Example - Storing API Responses:
   * ```typescript
   * When('fetch user data from API', async function() {
   *   // Setup and call API
   *   await this.restUtils.setupTranResourceURL('/users/me');
   *   await this.restUtils.setupTranRequest();
   *   await this.restUtils.getTransaction();
   *   
   *   // Get response and store in testData
   *   const userData = await this.restUtils.getResponseBody();
   *   this.testData.set('user', userData);
   * });
   * 
   * When('use stored user data', async function() {
   *   // Access stored data in later steps
   *   const user = this.testData.get('user');
   *   const userId = user.id;
   *   const userName = user.name;
   *   // Use in subsequent API calls
   * });
   * ```
   * 
   * Lifecycle:
   * - Scenario starts, CustomWorld created
   * - First step doesn't need to call restUtils
   * - When step calls this.restUtils (first access):
   *   - Getter checks if _restUtils exists
   *   - _restUtils is undefined, so creates new RESTUtils()
   *   - Caches in _restUtils property
   *   - Returns new instance
   * - Subsequent steps call this.restUtils:
   *   - Getter checks if _restUtils exists
   *   - _restUtils exists (cached), so skips creation
   *   - Returns cached instance
   * - After hook runs (cleanup, dispose API context)
   * - CustomWorld destroyed (garbage collected)
   * 
   * Thread Safety:
   * - Each scenario gets unique CustomWorld instance
   * - Each CustomWorld gets unique _restUtils instance (when created)
   * - Multiple scenarios can have different RESTUtils instances
   * - No shared state between scenario instances
   * - Safe for parallel test execution
   * 
   * Memory Efficiency:
   * - If scenario doesn't use API, RESTUtils not created
   * - Pure UI scenarios don't pay for API utility memory
   * - Pure API scenarios don't need browser resources
   * - Memory used only for what's needed
   * 
   * Comparison with Page Getters:
   * | Feature | loginPage | RESTUtils |
   * |---------|-----------|-----------|
   * | Requires browser | YES | NO |
   * | Requires page | YES | NO |
   * | Guard clause needed | YES | NO |
   * | Used for | UI testing | API testing |
   * | Dependencies | BrowserManager, Page | None |
   * | Creation cost | Medium (browser) | Low (no browser) |
   * 
   * Error Scenarios:
   * 1. Browser-based API call without browser:
   *    ```typescript
   *    // This is NOT an error - restUtils doesn't need browser
   *    const restUtils = browserManager2.restUtils; // Works fine
   *    ```
   * 
   * 2. API setup without full initialization (not error):
   *    ```typescript
   *    When('partially setup API', async function() {
   *      // Just accessing getter - no error
   *      const utils = this.restUtils; // OK
   *      // Errors come from method calls, not getter
   *    });
   *    ```
   * 
   * Best Practices:
   * - Use this.testData to store OAuth tokens for reuse
   * - Setup API context in Given step, not When
   * - Cleanup: call disposeAPIContext() in After hook
   * - Reuse same RESTUtils for multiple API calls in scenario
   * - Store responses in testData for multi-step validation
   */
  get restUtils(): RESTUtils {
    // If restUtils doesn't exist yet (first access), create it
    if (!this._restUtils) {
      // Create new RESTUtils instance for API testing
      // RESTUtils doesn't require browser, so no guard clause needed
      // No validation needed - RESTUtils is self-contained
      this._restUtils = new RESTUtils();
    }

    // Return cached instance for all subsequent accesses
    // Same RESTUtils instance reused throughout scenario
    // Maintains session state across multiple API calls
    return this._restUtils;
  }
}

/**
 * Register CustomWorld with Cucumber
 * 
 * Logic:
 * - Tells Cucumber to use CustomWorld as the World class for all scenarios
 * - When Cucumber starts a scenario, it calls: new CustomWorld(options)
 * - This makes CustomWorld instance available as 'this' in step definitions
 * - MUST be called ONCE to register the custom World class
 * 
 * Why Register?
 * - Cucumber needs to know what World class to instantiate
 * - Default World is basic and doesn't include browserManager, page objects, etc.
 * - Registration enables custom functionality in every step definition
 * - Enables dependency injection of utilities
 * 
 * Timing:
 * - Must be called when file is loaded (not in functions)
 * - Called after CustomWorld class is defined
 * - Called after all imports are complete
 * - Called before any scenarios run
 * - Test framework loads this file, calls this function, stores CustomWorld
 * 
 * Effect:
 * - Every step definition receives CustomWorld instance as 'this'
 * - All CustomWorld properties available in steps:
 *   - this.browserManager
 *   - this.page
 *   - this.testData
 *   - this.loginPage
 *   - this.homePage
 *   - this.restUtils
 * 
 * Usage Result:
 * ```typescript
 * // Step definition automatically gets CustomWorld as 'this'
 * Given('user starts browser', async function() {
 *   // 'this' is CustomWorld instance (registered via setWorldConstructor)
 *   // this.browserManager is available
 *   // this.testData is available
 *   // All CustomWorld properties are available
 *   await this.browserManager.launchBrowser(this);
 * });
 * ```
 * 
 * Under the Hood:
 * - Cucumber maintains a registry of World classes
 * - setWorldConstructor(CustomWorld) adds CustomWorld to registry
 * - When scenario starts, Cucumber does: new CustomWorld(options)
 * - Result passed to step definitions as 'this'
 * 
 * Important Notes:
 * - Only call setWorldConstructor ONCE per test suite
 * - Calling multiple times may cause issues
 * - Must pass the class itself, not an instance
 * - Usually called in support files (hooks.ts or World.ts)
 * 
 * Not Needed If:
 * - Using default Cucumber World (losing custom functionality)
 * - Creating manual World instances (losing Cucumber integration)
 * - Not needing custom properties in steps (rare)
 */
// Tell Cucumber to use our custom World class
// This makes CustomWorld available as 'this' in all step definitions
setWorldConstructor(CustomWorld);

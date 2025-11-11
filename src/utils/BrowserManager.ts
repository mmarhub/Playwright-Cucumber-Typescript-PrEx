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

export class BrowserManager {
  // Private properties - only accessible within this class
  // Using '| null' because these are undefined until initialized
  private browser: Browser | null = null;              // The browser instance
  private context: BrowserContext | null = null;       // Browser context (isolated session)
  private page: Page | null = null;                    // The page/tab instance

  /**
   * Launch Browser
   * 
   * Starts the browser based on configuration.
   * Supports Chromium (Chrome/Edge), Firefox, and WebKit (Safari)
   * 
   * Why different browsers?
   * - Test cross-browser compatibility
   * - Some bugs only appear in specific browsers
   */
  async launchBrowser(): Promise<void> {
    const browserType = config.browser;

    // Switch statement selects browser based on config
    switch (browserType) {
      case 'chromium':
        // Launch Chromium-based browser (Chrome, Edge)
        this.browser = await chromium.launch({
          headless: config.headless,      // Show/hide browser window
          ...config.launchOptions         // Spread operator: includes all launch options
        });
        break;
      case 'firefox':
        // Launch Firefox browser
        this.browser = await firefox.launch({
          headless: config.headless,
          ...config.launchOptions
        });
        break;
      case 'webkit':
        // Launch WebKit browser (Safari engine)
        this.browser = await webkit.launch({
          headless: config.headless,
          ...config.launchOptions
        });
        break;
    }

    const browserVersion = await this.browser.version();
    // Save it to .env for later use (e.g., in reports)
    await setEnvValue('RUN_BROWSER_VERSION', browserVersion);
  }

  /**
   * Create Browser Context
   * 
   * A context is like an "incognito window" - isolated browser session
   * with its own cookies, localStorage, and cache
   * 
   * Why use contexts?
   * - Test isolation: Each test starts fresh
   * - Parallel execution: Multiple contexts can run simultaneously
   * - Security: One test can't affect another
   */
  async createContext(): Promise<void> {
    // Guard clause: Ensure browser is launched first
    if (!this.browser) {
      throw new Error('Browser not launched. Call launchBrowser() first.');
    }

    // Get viewport size of the screen
    // const width = window.innerWidth;
    // const height = window.innerHeight;

    // Create new browser context with custom viewport and recording
    this.context = await this.browser.newContext({
      // Set viewport size (screen resolution)
      // viewport: { width: 1920, height: 1080 },
      viewport: null,
      //viewport: { width, height },

      // Record video of test execution (saved to reports/videos/)
      //recordVideo: { dir: 'reports/videos/' }
    });

    // Start tracing (records screenshots and snapshots for debugging)
    // await this.context.tracing.start({
    //   screenshots: true,   // Capture screenshots during test
    //   snapshots: true      // Capture DOM snapshots
    // });
  }

  /**
   * Create Page
   * 
   * Creates a new page (tab) in the browser context
   * 
   * @returns Page object for interacting with the webpage
   */
  async createPage(): Promise<Page> {
    // Guard clause: Ensure context exists
    if (!this.context) {
      throw new Error('Context not created. Call createContext() first.');
    }

    // Create new page (tab)
    this.page = await this.context.newPage();

    // Set default timeout for all operations on this page
    // If an action takes longer than this, it will fail
    this.page.setDefaultTimeout(config.timeout);

    return this.page;
  }

  /**
   * Close Browser
   * 
   * Properly closes all browser resources
   * IMPORTANT: Always call this to prevent resource leaks
   * 
   * Order matters:
   * 1. Stop tracing (save trace file)
   * 2. Close page
   * 3. Close context
   * 4. Close browser
   */
  async closeBrowser(): Promise<void> {
    // Stop tracing and save to file (for debugging failed tests)
    // if (this.context) {
    //   await this.context.tracing.stop({ path: 'reports/trace.zip' });
    // }

    // Close page if it exists
    if (this.page) await this.page.close();

    // Close context if it exists
    if (this.context) await this.context.close();

    // Close browser if it exists
    if (this.browser) await this.browser.close();
  }

  /**
   * Get Page
   * 
   * Returns the current page object
   * Throws error if page hasn't been created yet
   * 
   * @returns The page object for test interactions
   */
  getPage(): Page {
    // Guard clause: Ensure page exists
    if (!this.page) {
      throw new Error('Page not created. Call createPage() first.');
    }
    return this.page;
  }

  /**
   * Get Browser Context
   * 
   * Returns the current browser context
   * Throws error if context hasn't been created yet
   * 
   * @returns The browser context for test interactions
   */
  getContext(): BrowserContext {
    if (!this.context) {
      throw new Error('Context not created. Call createContext() first.');
    }
    return this.context;
  }
}

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
 * CustomWorld Interface
 * 
 * Defines what properties/methods are available in the World
 * TypeScript interface ensures type safety
 */
export interface ICustomWorld extends World {
  browserManager: BrowserManager;       // Manages browser lifecycle
  page?: Page;                          // Playwright page object (optional initially)
  testData: Map<string, any>;           // Store scenario-specific test data
  loginPage: GithubLoginPage;           // Login page object (lazy-loaded)
  homePage: GithubHomePage;             // Home page object (lazy-loaded)

  // For API Testing
  restUtils: RESTUtils;                 // REST API utility instance
}

/**
 * By default, asynchronous hooks and steps timeout after 5000 milliseconds. 
 * This can be modified globally with: setDefaultTimeout(60 * 1000).
 * 
 * Error: function timed out, ensure the promise resolves within 5000 milliseconds
 */
setDefaultTimeout(60 * 1000);

/**
 * CustomWorld Class
 * 
 * Implementation of ICustomWorld interface
 * This is instantiated once per scenario
 */
export class CustomWorld extends World implements ICustomWorld {
  // Public properties accessible in step definitions
  browserManager: BrowserManager;
  page?: Page;
  testData: Map<string, any>;

  // Private properties (only accessible within this class)
  // Underscore prefix indicates private by convention
  // ? means optional (may be undefined initially)
  private _loginPage?: GithubLoginPage;
  private _homePage?: GithubHomePage;

  // For API Testing
  private _restUtils?: RESTUtils;

  /**
   * Constructor
   * 
   * Called once when a new scenario starts
   * Initializes all properties with default values
   * 
   * @param options - Options passed by Cucumber
   */
  constructor(options: IWorldOptions) {
    // Call parent World constructor
    super(options);

    // Initialize browser manager (one per scenario)
    this.browserManager = new BrowserManager();

    // Initialize test data storage using Map
    // Map is better than object for dynamic key-value pairs
    this.testData = new Map<string, any>();
  }

  /**
   * Cleanly attach text, stripping ANSI color codes.
   */
  attachClean(data: any, mediaType: string = 'text/plain') {
    let cleaned = data;
    if (typeof data === 'string') {
      cleaned = stripAnsi(data);
    }
    return this.attach(cleaned, mediaType);
  }

  /**
   * Login Page Getter (Lazy Initialization Pattern)
   * 
   * This is a "getter" - looks like a property but executes code
   * Usage: this.loginPage (NOT this.loginPage())
   * 
   * Lazy initialization means:
   * - Page object created only when first accessed
   * - Subsequent accesses return cached instance
   * - Saves memory and initialization time
   * 
   * Why lazy?
   * - Not all scenarios need all pages
   * - Page created only after browser is ready
   */
  get loginPage(): GithubLoginPage {
    // If loginPage doesn't exist yet, create it
    if (!this._loginPage) {
      // Guard clause: Ensure page is initialized
      if (!this.browserManager.getPage()) {
        throw new Error('Page is not initialized. Ensure Before hook has run.');
      }

      // Create and cache the GithubLoginPage instance
      // Pass the Playwright Page instance from BrowserManager
      // '!' means we are sure it's not undefined here
      this._loginPage = new GithubLoginPage(this.browserManager!);
    }

    // Return cached instance
    return this._loginPage;
  }

  /**
   * Home Page Getter (Lazy Initialization Pattern)
   * 
   * Same pattern as loginPage getter
   * Each page object is created once and reused within the scenario
   */
  get homePage(): GithubHomePage {
    if (!this._homePage) {
      if (!this.browserManager.getPage()) {
        throw new Error('Page is not initialized. Ensure Before hook has run.');
      }
      this._homePage = new GithubHomePage(this.browserManager!);
    }
    return this._homePage;
  }

  // For API Testing
  get restUtils(): RESTUtils {
    if (!this._restUtils) {
      this._restUtils = new RESTUtils();
    }
    return this._restUtils;
  }
}

// Tell Cucumber to use our custom World class
// This makes CustomWorld available as 'this' in step definitions
setWorldConstructor(CustomWorld);

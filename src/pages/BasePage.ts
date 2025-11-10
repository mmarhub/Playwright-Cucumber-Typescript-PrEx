/**
 * Base Page - Abstract Parent Class for All Pages
 * 
 * This abstract class contains common functionality shared by all pages.
 * All page objects (LoginPage, HomePage, etc.) inherit from this class.
 * 
 * Benefits of BasePage:
 * - DRY (Don't Repeat Yourself): Write common code once
 * - Consistency: All pages use same methods for common actions
 * - Maintainability: Update one place to fix all pages
 * - Reusability: New pages automatically get all base functionality
 * 
 * Abstract Class means:
 * - Cannot be instantiated directly (new BasePage() is not allowed)
 * - Must be extended by child classes
 * - Can contain both implemented and abstract methods
 */

import { Page, Locator } from '@playwright/test';
import { config } from '../config/config';
import { BrowserManager } from '../utils/BrowserManager';

export abstract class BasePage {
  // Protected properties: accessible in this class and child classes
  protected page: Page;           // Playwright page object
  protected baseUrl: string;      // Base URL from configuration
  private browserManager?: BrowserManager;

  /**
   * Constructor
   * 
   * @param page - Playwright page object passed from child classes
   */
  // constructor(page: Page) {
  //   this.page = page;
  //   this.baseUrl = config.baseUrl;
  // }
  constructor(browserManager: BrowserManager) {
    this.browserManager = browserManager;
    this.page = browserManager.getPage()!;
    this.baseUrl = config.baseUrl;
  }

  /**
   * Navigate to URL
   * 
   * Opens a URL by combining base URL with path
   * Example: baseUrl = 'https://example.com', path = '/login'
   *          Result: 'https://example.com/login'
   * 
   * @param path - URL path to append to base URL (default: empty string)
   */
  async navigate(path: string = ''): Promise<void> {
    // Template literal combines baseUrl and path
    await this.page.goto(`${this.baseUrl}${path}`);
    //await this.browserManager?.getPage()?.bringToFront();
    //await this.browserManager?.getContext()?.pages().at(0)?.bringToFront();
  }

  /**
   * Wait for Page Load
   * 
   * Waits for page to fully load before proceeding
   * Two stages:
   * 1. domcontentloaded: HTML is parsed and DOM is built
   * 2. networkidle: No network activity for 500ms (all resources loaded)
   * 
   * Why wait?
   * - Ensures page is ready for interaction
   * - Prevents "element not found" errors
   * - More stable tests
   */
  async waitForPageLoad(): Promise<void> {
    // Wait for DOM to be ready
    await this.page.waitForLoadState('domcontentloaded');

    // Wait for network to be idle (all images, scripts, etc. loaded)
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click Element
   * 
   * Safely clicks an element after ensuring it's visible
   * 
   * @param locator - Playwright locator object (element reference)
   * 
   * Why wait for visibility?
   * - Element might not be rendered yet
   * - Element might be hidden or off-screen
   * - Prevents "element not clickable" errors
   */
  async clickElement(locator: Locator): Promise<void> {
    // Wait until element is visible on screen
    await locator.waitFor({ state: 'visible' });

    // Click the element
    await locator.click();
  }

  /**
   * Fill Input Field
   * 
   * Types text into an input field after ensuring it's visible
   * Automatically clears existing text before typing
   * 
   * @param locator - Input field locator
   * @param text - Text to type into the field
   */
  async fillInput(locator: Locator, text: string): Promise<void> {
    // Wait until input field is visible
    await locator.waitFor({ state: 'visible' });

    // Clear existing text and type new text
    // .fill() is faster than .type() as it doesn't simulate key presses
    await locator.fill(text);
  }

  /**
   * Get Text from Element
   * 
   * Extracts visible text content from an element
   * 
   * @param locator - Element locator
   * @returns Text content of the element (empty string if no text)
   */
  async getText(locator: Locator): Promise<string> {
    // Wait until element is visible
    await locator.waitFor({ state: 'visible' });

    // Get text content, return empty string if null
    // The '|| ""' is a fallback in case textContent returns null
    return await locator.textContent() || '';
  }

  /**
   * Check if Element is Visible
   * 
   * Checks if an element is visible on the page
   * Non-blocking: Returns false if element not found (doesn't throw error)
   * 
   * @param locator - Element locator
   * @returns true if visible, false if not visible or doesn't exist
   * 
   * Use case: Conditional logic based on element presence
   * Example: if (await isElementVisible(logoutButton)) { ... }
   */
  async isElementVisible(locator: Locator): Promise<boolean> {
    try {
      // Try to wait for element with 5 second timeout
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;  // Element is visible
    } catch {
      // If wait times out or element not found, return false
      // Using empty catch block as we expect this to fail sometimes
      return false;
    }
  }

  /**
   * Take Screenshot
   * 
   * Captures a full-page screenshot and saves to file
   * Useful for debugging and test evidence
   * 
   * @param name - Base name for screenshot file
   * 
   * Filename format: {name}-{timestamp}.png
   * Example: login-page-1699123456789.png
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      // Template literal creates unique filename with timestamp
      path: `reports/screenshots/${name}-${Date.now()}.png`,

      // Capture entire page (not just visible viewport)
      fullPage: true
    });
  }
}

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
import { expect } from '@playwright/test';
import { config } from '../config/config';
import { BrowserManager } from '../utils/BrowserManager';
import * as fs from 'fs';
import * as path from 'path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

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
    this.browserManager = browserManager!;
    this.page = browserManager.getPage()!;
    this.baseUrl = config.baseUrl;
  }

  async getBrowserManager(): Promise<BrowserManager | undefined> {
    return this.browserManager;
  }

  async scenarioLog(message: string = ''): Promise<void> {
    this.browserManager?.getScenario()?.attach(
      `"🔹 " ${message} 
      - A message from Thread ID: ${process.pid}.`,
      "text/plain",
    );
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

  async navigateToCustomUrl(url: string): Promise<void> {
    await this.page.goto(url);
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

  // Click Element by Selector
  async click(selector: string): Promise<void> {
    await this.waitForElementVisibleBySelector(selector);
    await this.page.locator(selector).click();
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

  // Fill Input Field by Selector
  async fill(selector: string, text: string): Promise<void> {
    await this.waitForElementVisibleBySelector(selector);
    await this.page.locator(selector).fill(text);
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

  // Get Text Content by Selector
  async getTextContent(selector: string): Promise<string> {
    await this.waitForElementVisibleBySelector(selector);
    return await this.page.locator(selector).textContent() || '';
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

  // Check if Element is Visible by Selector
  async isElementVisibleBySelector(selector: string): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor(
        { state: 'visible', timeout: 5000 }
      );
      return true;  // Element is visible
    } catch {
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
  async takeScreenshot(name: string): Promise<Buffer> {
    const buffer = await this.page.screenshot({
      // Template literal creates unique filename with timestamp
      path: `test-reports/screenshots/${name}-${Date.now()}.png`,

      // Capture entire page (not just visible viewport)
      // fullPage: true
    });
    return buffer;
  }

  // Wait for Element Visible by Locator
  async waitForElementVisibleByLocator(locator: Locator, timeout: number = 10000): Promise<void> {
    //await locator.waitFor({ state: 'visible', timeout: timeout });
    await expect(locator, `Selector not found: ${locator}`).toBeVisible({ timeout });
  }

  // Wait for Element Visible by Selector
  async waitForElementVisibleBySelector(selector: string, timeout: number = 10000): Promise<void> {
    const locator = this.page.locator(selector);
    // Instead of using loc.waitFor, use this expect().toBeVisible() for test effectiveness
    await expect(locator, `Locator Not Found ${locator}`).toBeVisible({ timeout: timeout });
  }

  // Click Element by Selector and Switch to New Tab
  async clickAndSwitchToNewTab(selector: string): Promise<void> {
    // Listen for new page (tab) event
    console.log(`before - this.page: ${this.page.url()}`);
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.page.locator(selector).click() // Click the element that opens new tab
    ]);

    // Bring the new tab to the front (focus)
    await newPage?.bringToFront();

    // Update the current page reference to the new tab
    this.page = newPage;
  }

  // Close Child Tab and Switch Back to Parent Tab
  async closeChildTabAndSwitchBackToParentTab(): Promise<void> {

    const currentPage = this.page;
    await currentPage.close();

    // Assuming the parent page is the first page in the context
    const pages = this.page.context().pages();
    const parentPage = pages[0];

    // Bring the parent tab to the front (focus)
    await parentPage.bringToFront();

    // Update the current page reference to the parent tab
    this.page = parentPage;
  }

  // async closeNewTabAndSwitchBack(): Promise<void> {

  //   const pages = this.page.context().pages();
  //   if (pages.length < 2) {
  //     throw new Error('No child tab to close.');
  //   }

  //   const parentPage = pages[0];
  //   const childPage = pages[pages.length - 1];

  //   // Close the child tab
  //   await childPage.close();

  //   // Switch back to the parent tab
  //   await parentPage.bringToFront();

  //   // Update the current page reference to the parent tab
  //   this.page = parentPage;
  // }

  // Highlight an element using a Playwright locator
  async highlightElement(selector: string): Promise<void> {
    await this.page.locator(selector).highlight();
  }

  // Highlight an element using custom logic
  async highlightElementCustom(selector: string, color = '#ff0000') {
    const element = await this.page.locator(selector).elementHandle();
    if (element) {
      await this.page.locator(selector).evaluate(el => {
        const orig = { b: el.style.border, bg: el.style.background };
        el.style.border = '4px solid #8B0000';
        el.style.background = 'rgba(255, 0, 0, 0.05)';
        setTimeout(() => { el.style.border = orig.b; el.style.background = orig.bg; }, 2000);
      });
    }
  }

  async scrollToElement(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  async downloadAndValidate(locator: string, expectedContent: string): Promise<boolean> {
    try {
      const downloadDir = path.resolve(
        process.cwd(),
        'src',
        'downloadedFiles'
      );

      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // Trigger the download
      const [download] = await Promise.all([
        this.page.waitForEvent('download'),
        this.page.locator(locator).click(),
      ]);

      // Determine final filename
      let suggested = download.suggestedFilename();
      if (!suggested) {
        suggested = `downloaded-file-${Date.now()}`;
      }

      const targetPath = path.resolve(downloadDir, suggested);

      // Remove any previous file with the same name
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }

      // Save the download
      await download.saveAs(targetPath);

      // Verify the file really exists and is not empty
      const exists = fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0;
      if (!exists) {
        this.scenarioLog(`Download completed but file not found or empty: ${targetPath}`);
        return false;
      }

      // Validate PDF content
      const validated = await this.validateContentInsidePDFFile(suggested, expectedContent);
      if (!validated) {
        this.scenarioLog(`Downloaded file found but content validation failed for: ${suggested}`);
      } else {
        this.scenarioLog(`Download and validation succeeded for file: ${suggested}`);
      }

      return exists && validated;
    } catch (e: any) {
      this.scenarioLog(`Download and validation failed due to exception: ${e.message}`);
      return false;
    }
  }

  async validateContentInsidePDFFile(fileName: string, expectedContent: string): Promise<boolean> {
    const downloadDir = path.resolve(
      process.cwd(),
      'src',
      'downloadedFiles'
    );
    const filePath = path.resolve(downloadDir, fileName);

    if (!fs.existsSync(filePath)) {
      this.scenarioLog(`File not found for validation: ${filePath}`);
      return false;
    }

    if (!expectedContent?.trim()) {
      this.scenarioLog('No expected content provided for validation');
      return false;
    }

    try {
      // Load the PDF (pdfjs works with Uint8Array)
      const data = new Uint8Array(fs.readFileSync(filePath));
      const pdf = await getDocument({ data }).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items
          .map((item: any) => item.str)
          .join(' ');
      }

      const found = fullText
        .toLowerCase()
        .includes(expectedContent.trim().toLowerCase());

      if (!found) {
        this.scenarioLog(`Expected content not found in file: ${fileName}`);
      }
      return found;
    } catch (e: any) {
      this.scenarioLog(`Failed to read/validate file: ${e.message}`);
      return false;
    }
  }

  async hoverElement(element: string | Locator): Promise<void> {
    const locator = typeof element === 'string' ? this.page.locator(element) : element;

    try {
      await this.waitForElementVisibleByLocator(locator)
      await locator.hover();
    } catch (error) {
      // Enhance error with context
      const selector = typeof element === 'string' ? element : '[Locator]';
      throw new Error(
        `Failed to hover over element: ${selector}\n` +
        `Reason: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    // if (typeof element === "string") {
    //   // case: string CSS/XPath selector
    //   await this.waitForElementVisibleBySelector(element);
    //   await this.page.locator(element).hover();

    // } else if (element instanceof this.page.locator('').constructor) {
    //   // case: Locator object
    //   await this.waitForElementVisibleByLocator(element);
    //   await element.hover();

    // } else {
    //   // TS safeguard (mainly for JS calls)
    //   throw new Error(
    //     `Element must be a string selector or Locator instance, but got: ${typeof element}`
    //   );
    // }
  }
}

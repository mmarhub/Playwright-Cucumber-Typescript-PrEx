/**
 * Login Page Object
 * 
 * Represents the Login page of the application.
 * Inherits common functionality from BasePage.
 * 
 * Page Object Model (POM) benefits:
 * - Encapsulation: Page structure hidden from tests
 * - Reusability: Methods can be used in multiple tests
 * - Maintainability: UI changes updated in one place
 * - Readability: Tests read like user actions
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { BrowserManager } from '../utils/BrowserManager';

export class GithubLoginPage extends BasePage {
  // Private locators: Element references on the page
  // 'readonly' means they can't be reassigned after initialization
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorMessage: Locator;
  private readonly signInButton: Locator;

  /**
   * Constructor
   * 
   * Initializes all locators for elements on the login page
   * Locators are not actual elements - they're references that are resolved when used
   * 
   * @param browserManager - BrowserManager instance
   */
  constructor(browserManager: BrowserManager) {
    // Call parent BasePage constructor
    super(browserManager);

    // Initialize locators using CSS selectors
    // '#' selects by ID, '.' selects by class, direct tag name, or attributes, '//' for XPath
    this.usernameInput = this.page.locator('input[name="login"]');
    this.passwordInput = this.page.locator('input[name="password"]');
    this.loginButton = this.page.locator('input[name="commit"]');
    this.errorMessage = this.page.locator('div[id="js-flash-container"] div[role="alert"]');
    this.signInButton = this.page.locator('//div[contains(@class, "HeaderMenu-link-wrap")]//a[@href="/login"]');
  }

  /**
   * Navigate to Login Page
   * 
   * Opens the login page and waits for it to load
   * Public method that tests can call
   */
  async navigateToLoginPage(): Promise<void> {
    // Call parent's navigate method with '/login' path
    await this.navigate('/login');
    
    // Wait for page to fully load
    await this.waitForPageLoad();
  }

  /**
   * Enter Username
   * 
   * Clicks the sign-in button
   * 
   */
  async clickSignInMenu(): Promise<void> {
    // Wait for page to fully load
    //await this.waitForPageLoad();
    // Use BasePage's fillInput method
    await this.clickElement(this.signInButton);
  }

  /**
   * Enter Username
   * 
   * Types username into the username field
   * 
   * @param username - Username text to enter
   */
  async enterUsername(username: string): Promise<void> {
    // Use BasePage's fillInput method
    await this.fillInput(this.usernameInput, username);
  }

  /**
   * Enter Password
   * 
   * Types password into the password field
   * 
   * @param password - Password text to enter
   */
  async enterPassword(password: string): Promise<void> {
    await this.fillInput(this.passwordInput, password);
  }

  /**
   * Click Login Button
   * 
   * Clicks the login/submit button
   */
  async clickSigninButton(): Promise<void> {
    // Use BasePage's clickElement method
    await this.clickElement(this.loginButton);
  }

  /**
   * Login (Composite Method)
   * 
   * Performs complete login action: enter username, password, and click login
   * This is a "composite" method combining multiple actions
   * 
   * @param username - Username to login with
   * @param password - Password to login with
   * 
   * Benefits:
   * - Single method call for common workflow
   * - Less code in step definitions
   * - Consistent login behavior across tests
   */
  async login(username: string, password: string): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickSigninButton();
  }

  /**
   * Get Error Message
   * 
   * Retrieves the text of the error message displayed
   * 
   * @returns Error message text
   */
  async getErrorMessage(): Promise<string> {
  // Use Locator to access the alert div
  const alertDiv = this.errorMessage;

  // Evaluate JS in the browser context to get only the direct text content (exclude child nodes)
  const text = await alertDiv.evaluate((el) => {
    let result = '';
    // Convert NodeList to an array so we can iterate in TypeScript environments
    for (const node of Array.from(el.childNodes)) {
      // 3 === Node.TEXT_NODE, using numeric constant avoids TS "Cannot find name 'Node'" error
      //if (node.nodeType === 3) {
      if (node.nodeType === Node.TEXT_NODE) {
        // '?' means optional chaining - only access textContent if node is not null/undefined
        result += node.textContent?.trim() || '';
      }
    }
    return result;
  });

  return text;
}

  // async getErrorMessage(): Promise<string> {
  //   return await this.getText(this.errorMessage);
  // }

  /**
   * Check if Error Message is Displayed
   * 
   * Checks whether an error message is visible on the page
   * 
   * @returns true if error is shown, false otherwise
   */
  async isErrorMessageDisplayed(): Promise<boolean> {
    return await this.isElementVisible(this.errorMessage);
  }
}

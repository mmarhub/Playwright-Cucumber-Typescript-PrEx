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
  // Private selectors: Element references on the page
  // 'readonly' means they can't be reassigned after initialization
  private readonly usernameInput: string;
  private readonly passwordInput: string;
  private readonly loginButton: string;
  private readonly errorMessage: string;
  private readonly signInButton: string;
  private readonly pwDiscordIcon: string;
  private readonly discordSiteHomeIcon: string;
  private readonly communityMenuLink: string;
  private readonly pwWelcomeTitle: string;
  private readonly pwTrainingVideosLink: string;

  /**
   * Constructor
   * 
   * Initializes all selectors for elements on the login page
   * Selectors are not actual elements - they're references that are resolved when used
   * 
   * @param browserManager - BrowserManager instance
   */
  constructor(browserManager: BrowserManager) {
    // Call parent BasePage constructor
    super(browserManager);

    // Initialize selectors using CSS selectors
    // '#' selects by ID, '.' selects by class, direct tag name, or attributes, '//' for XPath
    this.usernameInput = 'input[name="login"]';
    this.passwordInput = 'input[name="password"]';
    this.loginButton = 'input[name="commit"]';
    this.errorMessage = 'div[id="js-flash-container"] div[role="alert"]';
    this.signInButton = '//div[contains(@class, "HeaderMenu-link-wrap")]//a[@href="/login"]';
    this.pwDiscordIcon = 'a[aria-label="Discord server"]';
    this.discordSiteHomeIcon = '//header[contains(@class, "wrapperDesktop")]//a[contains(@class, "logoLink")]';
    this.communityMenuLink = '//a[contains(text(), "Community")]';
    this.pwWelcomeTitle = 'article header h1';
    this.pwTrainingVideosLink = '//li[@class="footer__item"]/a[contains(@href, "training")]';
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
    // Use BasePage's click method
    await this.click(this.signInButton);
  }

  /**
   * Enter Username
   * 
   * Types username into the username field
   * 
   * @param username - Username text to enter
   */
  async enterUsername(username: string): Promise<void> {
    // Use BasePage's fill method
    await this.fill(this.usernameInput, username);
  }

  /**
   * Enter Password
   * 
   * Types password into the password field
   * 
   * @param password - Password text to enter
   */
  async enterPassword(password: string): Promise<void> {
    await this.fill(this.passwordInput, password);
  }

  /**
   * Click Login Button
   * 
   * Clicks the login/submit button
   */
  async clickSigninButton(): Promise<void> {
    // Use BasePage's click method
    await this.click(this.loginButton);
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
    // Use selector to access the alert div
    const alertDiv = (await this.getBrowserManager())?.getPage().locator(this.errorMessage);

    // Evaluate JS in the browser context to get only the direct text content (exclude child nodes)
    const text = await alertDiv?.evaluate((el) => {
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

    return text || '';
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
    return await this.isElementVisibleBySelector(this.errorMessage);
  }

  async clickDiscordIcon(): Promise<void> {
    await this.clickAndSwitchToNewTab(this.pwDiscordIcon);
  }

  async isDiscordHomePageVisible(): Promise<boolean> {
    await this.waitForElementVisibleBySelector(this.discordSiteHomeIcon);
    return await this.isElementVisibleBySelector(this.discordSiteHomeIcon);
  }

  async clickCommunityMenu(): Promise<void> {
    await this.click(this.communityMenuLink);
  }

  async getPWWelcomeText(): Promise<string> {
    return await this.getTextContent(this.pwWelcomeTitle);
  }

  async scrollToPlaywrightTrainingButton(): Promise<void> {
    await this.highlightElementCustom(this.pwTrainingVideosLink);
    await this.scrollToElement(this.pwTrainingVideosLink);
    this.scenarioLog(`Scrolled and highlighted to the proper element: ${this.pwTrainingVideosLink.toString()}`)
  }

  async isPlaywrightTrainingButtonVisible(): Promise<boolean> {
    return await this.isElementVisibleBySelector(this.pwTrainingVideosLink);
  }
}

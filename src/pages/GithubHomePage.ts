/**
 * Pricing Page Object
 * 
 * Represents the Pricing page (dashboard/landing page after login)
 * Contains methods to interact with pricing page elements
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { BrowserManager } from '../utils/BrowserManager';

export class GithubHomePage extends BasePage {
  // Pricing page element selectors
  private readonly pricingLink: string;
  private readonly pricingTitle: string;
  private readonly welcomeMessage: string;
  private readonly logoutButton: string;
  private readonly userProfile: string;
  /**
   * Constructor
   * 
   * Initializes pricing page selectors
   * 
   * @param browserManager - BrowserManager instance
   */
  constructor(browserManager: BrowserManager) {
    super(browserManager);
    
    // Initialize selectors for home pricing elements
    this.pricingLink = '//nav[@aria-label="Global"]//span[contains(text(),"Pricing")]';
    this.pricingTitle = '//h1[@class="h2-mktg"]';
    this.welcomeMessage = '//div[contains(@class, "welcome-message")]';
    this.logoutButton = '//summary[@aria-label="View profile and more"]';
    this.userProfile = '//img[@alt="@username"]'; // Example user profile image locator
  }

  /**
   * Click Pricing Link
   * 
   * Clicks the Pricing link in the navigation menu
   * 
   * @returns void
   */
  async clickPricingLink(): Promise<void> {
    // how can we know which run thread is executing this code?
    await this.click(this.pricingLink);
  }

  /**
   * Get Pricing Title
   * 
   * Retrieves the title text of the Pricing page
   * Example: "Plans for every developer"
   * 
   * @returns Pricing title text
   */
  async getPricingTitle(): Promise<string> {
    return await this.getTextContent(this.pricingTitle);
  }

  /**
   * Get Welcome Message
   * 
   * Retrieves the welcome message text displayed to the user
   * Example: "Welcome, John!"
   * 
   * @returns Welcome message text
   */
  async getWelcomeMessage(): Promise<string> {
    return await this.getTextContent(this.welcomeMessage);
  }

  /**
   * Check if Welcome Message is Displayed
   * 
   * Verifies the welcome message is visible
   * 
   * @returns true if visible, false otherwise
   */
  async isWelcomeMessageDisplayed(): Promise<boolean> {
    return await this.isElementVisibleBySelector(this.welcomeMessage);
  }

  /**
   * Click Logout
   * 
   * Clicks the logout button to sign out
   */
  async clickLogout(): Promise<void> {
    await this.click(this.logoutButton);
  }

  /**
   * Check if User is Logged In
   * 
   * Verifies user is logged in by checking if user profile is visible
   * 
   * @returns true if logged in, false otherwise
   */
  async isLoggedIn(): Promise<boolean> {
    return await this.isElementVisibleBySelector(this.userProfile);
  }
}

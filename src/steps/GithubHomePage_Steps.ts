/**
 * Step Definitions - Pricing Feature
 * 
 * Step definitions are the "glue" between Gherkin steps and automation code.
 * They connect human-readable feature files to actual code execution.
 * 
 * Gherkin Step (in .feature file):
 *   Given I click on Pricing link
 * 
 * Step Definition (this file):
 *   Given('I click on Pricing link', async function() { ... })
 * 
 * Key Points:
 * - Use 'this: CustomWorld' to access World properties
 * - async/await for asynchronous operations
 * - Parameters captured from step text using {string}, {int}, etc.
 * - Keep steps focused on WHAT to do, not HOW to do it
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../utils/World';

/**
 * GIVEN STEPS
 * 
 * 'Given' steps set up the precondition/context for the test
 * They establish the starting state
 * Example: "When I click on Pricing link"
 */

/**
 * Step: User clicks on Pricing link
 * 
 * Matches Gherkin: Given I click on Pricing link
 * 
 * This step navigates to the Pricing page
 * 
 * How it works:
 * 1. this.githubHomePage calls the lazy getter in CustomWorld
 * 2. First access creates GithubHomePage instance
 * 3. clickPricingLink() method is called
 * 4. Browser clicks on Pricing link
 */
When('I click on Pricing link', async function (this: CustomWorld) {
  // Access homePage from World (created lazily on first access)
  // Call clickPricingLink method to click on Pricing link
  await this.homePage.clickPricingLink();
});

/**
 * Step: User gets Pricing title
 * 
 * Matches Gherkin: Then I should see the pricing page with title "Try the Copilot-powered platform"
 * 
 * This step retrieves the title of the Pricing page
 * 
 */
Then('I should see the pricing page with title {string}', async function (this: CustomWorld, expectedTitle: string) {
  // Call getPricingTitle method on homePage
  const title = await this.homePage.getPricingTitle();
  this.attachClean(`Pricing page title: ${title}`, 'text/plain');
  // Assert the title matches the expected title
  expect(title).toBe(expectedTitle);
});



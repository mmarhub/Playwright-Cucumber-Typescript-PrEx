/**
 * Step Definitions - Login Feature
 * 
 * Step definitions are the "glue" between Gherkin steps and automation code.
 * They connect human-readable feature files to actual code execution.
 * 
 * Gherkin Step (in .feature file):
 *   Given the user is on the login page
 * 
 * Step Definition (this file):
 *   Given('the user is on the login page', async function() { ... })
 * 
 * Key Points:
 * - Use 'this: CustomWorld' to access World properties
 * - async/await for asynchronous operations
 * - Parameters captured from step text using {string}, {int}, etc.
 * - Keep steps focused on WHAT to do, not HOW to do it
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from "chai";
import { CustomWorld } from '../utils/World';

let insVarMenuLink: string;

/**
 * GIVEN STEPS
 * 
 * 'Given' steps set up the precondition/context for the test
 * They establish the starting state
 * Example: "Given the user is logged in"
 */

/**
 * Step: User is on the login page
 * 
 * Matches Gherkin: Given the user is on the login page
 * 
 * This step navigates to the login page
 * 
 * How it works:
 * 1. this.loginPage calls the lazy getter in CustomWorld
 * 2. First access creates LoginPage instance
 * 3. navigateToLoginPage() method is called
 * 4. Browser navigates to login URL
 */
// Given('the user is on the login page', async function (this: CustomWorld) {
//   // Access loginPage from World (created lazily on first access)
//   // Call navigateToLoginPage method to open login page
//   await this.loginPage.navigateToLoginPage();
// });

Given('Open the browser and start {string} application', async function (this: CustomWorld, appName: string) {
  // Access loginPage from World (created lazily on first access)
  // Call navigate method to open home page
  await this.loginPage.navigate();
  this.attachClean(`Opened the browser and started the ${appName} application`, 'text/plain');
});

/*
* Step: User clicks signin link
* 
* Matches Gherkin: Given the user clicks the signin link
* 
* This step clicks the signin link to go to login page
*/
When('I click on Sign in link', async function (this: CustomWorld) {
  // Call clickSignInMenu method on LoginPage
  await this.loginPage.clickSignInMenu();
});

/**
 * WHEN STEPS
 * 
 * 'When' steps describe the action/event
 * They are the actual behavior being tested
 * Example: "When the user clicks the login button"
 */

/**
 * Step: User enters username
 * 
 * Matches Gherkin: When the user enters username "testuser"
 * 
 * @param username - Captured from {string} placeholder in step text
 * 
 * How parameters work:
 * - {string} in step definition matches quoted text in feature file
 * - Value passed as function parameter
 * - Can use multiple parameters: {string}, {int}, {float}
 */
// When('the user enters username {string}', async function (this: CustomWorld, username: string) {
//   // Call enterUsername method on LoginPage
//   // The username parameter is captured from the Gherkin step
//   await this.loginPage.enterUsername(username);
// });
When('I enter username {string}', async function (this: CustomWorld, username: string) {
  // Call enterUsername method on LoginPage
  // The username parameter is captured from the Gherkin step
  this.attachClean(`Thread ID: ${process.pid} - Entering username: ${username}`);
  await this.loginPage.enterUsername(username);
});

/**
 * Step: User enters password
 * 
 * Matches Gherkin: When the user enters password "MyPass123"
 * 
 * @param password - Password text from feature file
 */
// When('the user enters password {string}', async function (this: CustomWorld, password: string) {
//   await this.loginPage.enterPassword(password);
// });
When('I enter password {string}', async function (this: CustomWorld, password: string) {
  await this.loginPage.enterPassword(password);
});

/**
 * Step: User clicks signin button
 * 
 * Matches Gherkin: When the user clicks the signin button
 * 
 * No parameters - this is a simple action step
 */
// When('the user clicks the login button', async function (this: CustomWorld) {
//   await this.loginPage.clickSigninButton();
// });
When('I click on Sign in button', async function (this: CustomWorld) {
  await this.loginPage.clickSigninButton();
});

/**
 * Step: User logs in with credentials (composite action)
 * 
 * Matches Gherkin: When the user logs in with username "user" and password "pass"
 * 
 * This is a composite step that combines multiple actions:
 * 1. Enter username
 * 2. Enter password
 * 3. Click login button
 * 
 * @param username - Username to login with
 * @param password - Password to login with
 * 
 * Benefits of composite steps:
 * - Less verbose feature files
 * - Reusable common workflows
 * - Faster test execution (fewer step executions)
 */
When('the user logs in with username {string} and password {string}',
  async function (this: CustomWorld, username: string, password: string) {
    // Call composite login method that does all actions at once
    await this.loginPage.login(username, password);
  });

/**
 * THEN STEPS
 * 
 * 'Then' steps verify the outcome/result
 * They contain assertions (expect statements)
 * Example: "Then the user should see the home page"
 */

/**
 * Step: User should see home page
 * 
 * Matches Gherkin: Then the user should see the home page
 * 
 * This step verifies successful login by checking if home page is displayed
 * 
 * expect() assertions:
 * - Come from Playwright/Jest
 * - If assertion fails, test fails
 * - toBeTruthy() checks if value is truthy (true, non-zero, non-empty, etc.)
 */
Then('the user should see the home page', async function (this: CustomWorld) {
  // Check if user is logged in (user profile visible)
  const isLoggedIn = await this.homePage.isLoggedIn();

  // Assert that user is logged in
  // If isLoggedIn is false, test fails with assertion error
  expect(isLoggedIn).to.be.true;
});

/**
 * Step: User should see error message
 * 
 * Matches Gherkin: Then the user should see an error message
 * 
 * Verifies that an error message is displayed (negative test case)
 */
Then('the user should see an error message', async function (this: CustomWorld) {
  // Check if error message is visible on the page
  const isErrorDisplayed = await this.loginPage.isErrorMessageDisplayed();

  // Assert that error is displayed
  expect(isErrorDisplayed).to.be.true;
});

/**
 * Step: Error message contains specific text
 * 
 * Matches Gherkin: Then the error message should contain "Invalid credentials"
 * 
 * @param expectedMessage - Text that should be present in error message
 * 
 * This step verifies the error message content (not just its presence)
 * Useful for validating specific error conditions
 */
Then('the error message should contain {string}',
  async function (this: CustomWorld, expectedMessage: string) {
    // Get the actual error message text from the page
    const errorMessage = await this.loginPage.getErrorMessage();

    // Assert that error message contains expected text
    // toContain() does partial match (not exact match)
    // Example: errorMessage = "Error: Invalid credentials"
    //          expectedMessage = "Invalid"
    //          Test passes!
    expect(errorMessage).to.equal(expectedMessage);
  });

/**
  * Step: I should see error message
  * 
  * Matches Gherkin: Then I should see error message "Invalid username or password"
  * 
  * @param expectedMessage - Text that should be present in error message
  * 
  * This step verifies the error message content (not just its presence)
  * Useful for validating specific error conditions
*/
Then('I should see error message {string}',
  async function (this: CustomWorld, expectedMessage: string) {
    // Get the actual error message text from the page
    const errorMessage = await this.loginPage.getErrorMessage();

    // Assert that error message contains expected text
    // toContain() does partial match (not exact match)
    // Example: errorMessage = "Error: Invalid credentials"
    //          expectedMessage = "Invalid"
    //          Test passes!
    expect(errorMessage).to.equal(expectedMessage);
  });

Given('I open the webpage {string}',
  async function (this: CustomWorld, url: string) {
    await this.loginPage.navigateToCustomUrl(url);
  });

When('I click the Discord icon and navigate to the new tab',
  async function (this: CustomWorld) {
    await this.loginPage.clickDiscordIcon();
  });

When('I verify the title contains {string}',
  async function (this: CustomWorld, expectedTitle: string) {
    expect(await this.loginPage.isDiscordHomePageVisible()).to.be.true;
  });

When('I close the new tab and switch back to the main tab',
  async function (this: CustomWorld) {
    await this.loginPage.closeChildTabAndSwitchBackToParentTab();
  });

When('I click the {string} menu link',
  async function (this: CustomWorld, menuLink: string) {
    await this.loginPage.clickCommunityMenu();
  });

Then('I verify the text {string} is visible on the page',
  async function (this: CustomWorld, expectedText: string) {
    const actualText = await this.loginPage.getPWWelcomeText();
    expect(actualText).to.equal(expectedText);
  });

When('I scroll to the {string} button',
  async function (this: CustomWorld, buttonText: string) {
    await this.loginPage.scrollToPlaywrightTrainingButton();
    const buffer = await this.loginPage.takeScreenshot('highlighted-element');
    if (buffer) {
      this.attach(buffer, 'image/png');
    }
  });

Then('I verify the {string} button is visible on the page',
  async function (this: CustomWorld, buttonText: string) {
    const isVisible = await this.loginPage.isPlaywrightTrainingButtonVisible();
    expect(isVisible).to.be.true;
  });

When('I hover over the {string} menu link',
  async function (this: CustomWorld, menuName: string) {
    insVarMenuLink = menuName;
    await this.loginPage.hoverOverElement(menuName);
  });

Then('I verify the {string} submenu is displayed',
  async function (this: CustomWorld, subMenuName: string) {
    expect(
      await this.loginPage.isSubMenuVisible(insVarMenuLink, subMenuName),
      `Submenu '${subMenuName}' is not visible.`
    ).to.be.true;
  });

When('I hover over the Enterprise menu link',
  async function (this: CustomWorld) {
    this.loginPage.hoverOverEnterpriseMenu();
  });

Then('I verify the Enterprise Platform submenu is displayed',
  async function (this: CustomWorld) {
    expect(
      await this.loginPage.isEnterprisePlatformSubMenuVisible(),
      `Enterprise Platform submenu is not visible.`
    ).to.be.true;
  });

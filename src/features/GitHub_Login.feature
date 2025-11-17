# Feature File - Login Feature
#
# Feature files are written in Gherkin language (business-readable DSL)
# They describe application behavior from user's perspective
#
# Gherkin Keywords:
# - Feature: High-level description of functionality
# - Background: Steps that run before each scenario (common setup)
# - Scenario: Individual test case
# - Scenario Outline: Template for multiple similar scenarios
# - Given: Precondition (setup)
# - When: Action (trigger)
# - Then: Expected result (verification)
# - And: Continuation of previous step type
# - But: Negative continuation
# - Examples: Data table for Scenario Outline
# - @tags: Labels for organizing/filtering tests

@regression
Feature: GitHub User Login Functionality
  # Feature description: What functionality does this feature test?
  # This should be understandable by business stakeholders

  # Background runs before EACH scenario in this feature
  # Use it for common setup steps
  # Background:
  #Given the user is on the login page
  # Given Open the browser and start "github" application

  # Tags: @smoke = run in smoke test suite, @login = login-related tests
  # Run with: npm run test:tags "@smoke"
  @positive @login
  Scenario: Successful login with valid credentials
    Given Open the browser and start "github" application
    When I click on Sign in link
    And I enter username "positive@test.com"
    And I enter password "password123"
    And I click on Sign in button
    Then I should see error message "Incorrect username or password."

  # @negative = negative test case (testing failure scenarios)
  @negative @login
  Scenario: Failed login with invalid credentials
    Given Open the browser and start "github" application
    When I click on Sign in link
    And I enter username "negative@test.com"
    And I enter password "password123"
    And I click on Sign in button
    Then I should see error message "Incorrect username or password. - fail"

  # Scenario Outline: Template for data-driven testing
  # Runs multiple times with different data from Examples table
  @negative @login @wip
  Scenario Outline: Login with multiple invalid credentials
    Given Open the browser and start "github" application
    When I click on Sign in link
    When the user logs in with username "<username>" and password "<password>"
    Then the user should see an error message
    And the error message should contain "<message>"

    Examples:
      | username           | password  | message                                |
      | emptyuser@test.com | emptypass | Incorrect username or password.        |
      | wronguser@test.com | wrongpass | Incorrect username or password. - fail |

  @switchtab
  Scenario: Open Discord tab and verify then return to main tab and verify Community
    Given I open the webpage "https://playwright.dev/"
    When I click the Discord icon and navigate to the new tab
    And I verify the title contains "Discord"
    And I close the new tab and switch back to the main tab
    When I click the "Community" menu link
    Then I verify the text "Welcome" is visible on the page

  @scroll
  Scenario: ScrollintoView example
    Given I open the webpage "https://playwright.dev/"
    When I scroll to the "Playwright Training" button
    Then I verify the "Playwright Training" button is visible on the page

  @hover
  Scenario: Testing the hover function
    Given Open the browser and start "github" application
    When I hover over the "Enterprise" menu link
    Then I verify the "Enterprise platform" submenu is displayed
    When I hover over the "Resources" menu link
    Then I verify the "DevOps" submenu is displayed
    When I hover over the Enterprise menu link
    Then I verify the Enterprise Platform submenu is displayed
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
  Background:
    #Given the user is on the login page
    Given Open the browser and start "github" application

  # Tags: @smoke = run in smoke test suite, @login = login-related tests
  # Run with: npm run test:tags "@smoke"
  @positive @login
  Scenario: Successful login with valid credentials
    When I click on Sign in link
    And I enter username "positive@test.com"
    And I enter password "password123"
    And I click on Sign in button
    Then I should see error message "Incorrect username or password."

  # @negative = negative test case (testing failure scenarios)
  @negative @login
  Scenario: Failed login with invalid credentials
    When I click on Sign in link
    And I enter username "negative@test.com"
    And I enter password "password123"
    And I click on Sign in button
    Then I should see error message "Incorrect username or password. - fail"

  # Scenario Outline: Template for data-driven testing
  # Runs multiple times with different data from Examples table
  @negative @login @wip
  Scenario Outline: Login with multiple invalid credentials
    When I click on Sign in link
    When the user logs in with username "<username>" and password "<password>"
    Then the user should see an error message
    And the error message should contain "<message>"

    Examples:
      | username           | password  | message                                |
      | emptyuser@test.com | emptypass | Incorrect username or password.        |
      | wronguser@test.com | wrongpass | Incorrect username or password. - fail |


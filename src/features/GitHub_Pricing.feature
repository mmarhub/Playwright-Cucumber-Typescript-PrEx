@regression
Feature: GitHub Pricing Functionality
    As a user
    I want to test GitHub pricing functionality
    So that I can verify pricing page access and content

    @positive @pricing
    Scenario: Verify the pricing page - positive test
        Given Open the browser and start "github" application
        When I click on Pricing link
        Then I should see the pricing page with title "Try the Copilot-powered platform"

    @negative @pricing
    Scenario: Verify the pricing page - negative test
        Given Open the browser and start "github" application
        When I click on Pricing link
        Then I should see the pricing page with title "Try the Copilot-powered platform - fail"

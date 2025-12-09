@api
Feature: Paypals Webhooks Basic Functionality
  Testing Paypals Webhooks API to Create, GetOne, Update, Delete Webhooks

  @api
  Scenario: Create a Webhook --> Get the same Webhook by Id --> Delete the Webhook
    Given I generate OAuth token with resource "/v1/oauth2/token"
    Then I form a client with this resource url "/v1/notifications/webhooks"
    Then I get the "request" content from "ScenarioRequests" file for the scenario "Scenario1"
    Then I make a "POST" call with OAuth token and capture the response
    Then I should receive the HTTP status code in response as 201
    Then I extract value from response using json path "$['id']" and store as "webhookId"
    Then I form a client by manipulating the resource url with "/v1/notifications/webhooks/{webhookId}"
    Then I make a "GET" call with OAuth token and capture the response
    Then I should receive the HTTP status code in response as 200
    Then I form a client by manipulating the resource url with "/v1/notifications/webhooks/{webhookId}"
    Then I make a "DELETE" call with OAuth token and capture the response
    Then I should receive the HTTP status code in response as 204

  @api
  Scenario: Create a Webhook --> Update (PATCH) the Webhook --> Get the same Webhook by Id to verify the update --> Delete the Webhook
    Given I generate OAuth token with resource "/v1/oauth2/token"
    Then I form a client with this resource url "/v1/notifications/webhooks"
    Then I get the "request" content from "ScenarioRequests" file for the scenario "Scenario2"
    Then I make a "POST" call with OAuth token and capture the response
    Then I should receive the HTTP status code in response as 201
    Then I extract value from response using json path "$['id']" and store as "webhookId"
    Then I form a client by manipulating the resource url with "/v1/notifications/webhooks/{webhookId}"
    Then I make a "GET" call with OAuth token and capture the response
    Then I should receive the HTTP status code in response as 200
    Then I get the "request" content from "ScenarioRequests" file for the scenario "PATCH_Scenario"
    And I modify the request payload with below values for respective json paths:
      | jsonPath            | value                                        |
      | $.[0].value         | https://example-<random>.com/another_webhook |
      | $.[1].value[0].name | PAYMENT.SALE.REFUNDED                        |
    Then I form a client by manipulating the resource url with "/v1/notifications/webhooks/{webhookId}"
    Then I make a "PATCH" call with OAuth token and capture the response
    Then I should receive the HTTP status code in response as 200
    Then I form a JsonPath and verify the output object with ExpectedObject:
      | JsonPath                    | ExpectedObject        |
      | $.event_types[0].name       | PAYMENT.SALE.REFUNDED |
      | $['event_types'][0]['name'] | Payment.Sale.Refunded |
    Then I form a client by manipulating the resource url with "/v1/notifications/webhooks/{webhookId}"
    Then I make a "GET" call with OAuth token and capture the response
    Then I should receive the HTTP status code in response as 200
    Then I form a JsonPath and verify the output object with ExpectedObject:
      | JsonPath                    | ExpectedObject        |
      | $.event_types[0].name       | PAYMENT.SALE.REFUNDED |
      | $['event_types'][0]['name'] | Payment.Sale.Refunded |
    Then I form a client by manipulating the resource url with "/v1/notifications/webhooks/{webhookId}"
    Then I make a "DELETE" call with OAuth token and capture the response
    Then I should receive the HTTP status code in response as 204

  @api
  Scenario: Create a Webhook by modifying the request payload values --> Get the same Webhook by Id --> Delete the Webhook
    Given I generate OAuth token with resource "/v1/oauth2/token"
    Then I form a client with this resource url "/v1/notifications/webhooks"
    Then I get the "request" content from "ScenarioRequests" file for the scenario "Scenario3"
    And I modify the request payload with below values for respective json paths:
      | jsonPath                    | value                                            |
      | $['url']                    | https://example-<random>.com/yet_another_webhook |
      | $['event_types'][0]['name'] | PAYMENT.CAPTURE.COMPLETED                        |
    Then I make a "POST" call with OAuth token and capture the response
    Then I should receive the HTTP status code in response as 201
    Then I extract value from response using json path "$['id']" and store as "webhookId"
    And I extract value from response using json path "$.url" and store as "createdWebhookUrl"
    And I extract value from response using json path "$.event_types[0].name" and store as "firstEventName"
    And I extract value from response using json path "$['event_types'][0]['name']" and store as "firstEventName"
    Then I form a JsonPath and verify the output object with ExpectedObject:
      | JsonPath                    | ExpectedObject            |
      | $.event_types[0].name       | PAYMENT.CAPTURE.COMPLETED |
      | $['event_types'][0]['name'] | Payment.Capture.Completed |
    Then I form a client by manipulating the resource url with "/v1/notifications/webhooks/{webhookId}"
    Then I make a "GET" call with OAuth token and capture the response
    Then I should receive the HTTP status code in response as 200
    Then I form a client by manipulating the resource url with "/v1/notifications/webhooks/{webhookId}"
    Then I make a "DELETE" call with OAuth token and capture the response
    Then I should receive the HTTP status code in response as 204

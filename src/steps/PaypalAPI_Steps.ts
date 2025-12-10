import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { expect, use } from "chai";
import { CustomWorld } from "../utils/World";
import { APIResponse } from "@playwright/test";
import { promises as fs } from 'fs';
import yaml from 'js-yaml';
import { JSONPath } from 'jsonpath-plus';
import chaiExclude from 'chai-exclude';

// Extend Chai with chai-exclude for deep equality checks ignoring specific fields
use(chaiExclude);

Given('I generate OAuth token with resource {string}', async function (this: CustomWorld, resource: string) {
  // Setup OAuth API request context and resource URL
  await this.restUtils.setupOAuthResourceURL(resource);
  await this.restUtils.setupOAuthRequest();

  // Get client ID and secret from environment variables
  const clientId = process.env.CLIENT_ID || '';
  const clientSecret = process.env.CLIENT_SECRET || '';

  // Get OAuth token from the API and validate response status 200 OK
  const response: APIResponse = await this.restUtils.getOAuthToken(clientId, clientSecret);
  expect(response.status()).to.equal(200);

  // Extract token from response and store in test data map
  const responseBody = await response.json();
  this.testData.set('OAuthToken', responseBody.access_token);
  this.attach(`Generated OAuth Token: ${responseBody.access_token}`);
  //this.attach(`Full OAuth Response: ${JSON.stringify(responseBody, null, 2)}`);
});

Then('I form a client with this resource url {string}', async function (this: CustomWorld, resource: string) {
  // Setup Transaction API request context and resource URL
  await this.restUtils.setupTranResourceURL(resource);
  await this.restUtils.setupTranRequest();
  this.attach(`Formed client with resource URL: ${resource}.`);
});

Then('I get the {string} content from {string} file for the scenario {string}', async function (this: CustomWorld, contentType: string, fileName: string, scenarioName: string) {
  const normalizedType = contentType.trim().toLowerCase();

  // Determine file based on content type (request/response)
  let fileNameWithFolder: string;
  if (normalizedType === 'request') {
    fileNameWithFolder = 'apiRequests/' + fileName + '.yml';
  } else if (normalizedType === 'response') {
    fileNameWithFolder = 'apiResponses/' + fileName + '.yml';
  } else {
    throw new Error(`Invalid type "${contentType}". Must be "request" or "response".`);
  }

  // Build full file path: e.g. /path/to/project/src/apiRequests/ScenarioRequests.yml
  const filePath = `${process.cwd()}/src/${fileNameWithFolder}`;

  // Read and parse YAML file to extract payload for the given scenario
  let fileContent: string;
  try {
    fileContent = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read YAML file: ${filePath}\n
      ${error instanceof Error ? error.message : String(error)}`);
  }

  // Simple YAML parsing (assuming well-formed YAML with scenario names as top-level keys)
  let parsedYaml: any;
  try {
    parsedYaml = yaml.load(fileContent) as any;
  } catch (error) {
    throw new Error(`Failed to parse YAML file: ${filePath}\n
      ${error instanceof Error ? error.message : String(error)}`);
  }

  // Extract the specific scenario's content from the parsed object.
  const jsonObject: any = parsedYaml?.[scenarioName];
  if (!jsonObject) {
    throw new Error(
      `Scenario "${scenarioName}" not found in file: ${filePath}` +
      `Available scenarios: ${Object.keys(parsedYaml || {}).join(', ')}`
    );
  }

  // Convert the scenario object back to JSON string for API body payload
  const jsonString = JSON.stringify(jsonObject, null, 2);

  // Store the JSON object for use in subsequent API calls
  // `${normalizedType}Object` key pattern: e.g. "requestObject" or "responseObject"
  this.testData.set(`${normalizedType}Object`, jsonObject);
  this.attach(`Loaded ${contentType} for scenario "${scenarioName}" from file: ${filePath}\n
    Payload:\n${jsonString}`);
});

// This step helps to modify specific fields in the request payload using JSON paths and values from the data table
Then('I modify the request payload with below values for respective json paths:', async function (this: CustomWorld, dataTable: DataTable) {
  // Retrieve the existing request object from test data
  const requestObject = this.testData.get('requestObject');
  if (!requestObject) {
    throw new Error('Request object not found in test data. Ensure that the request payload is loaded before modification.');
  }

  // Iterate over each row in the data table to apply modifications
  const updates = dataTable.hashes();
  for (const { jsonPath, value } of updates) {
    let finalValue: any = value.trim();

    // Replace <random> with 3-digit random number
    if (finalValue.includes('<random>')) {
      const random3 = Math.floor(100 + Math.random() * 900); // 100–999
      finalValue = finalValue.replace(/<random>/g, String(random3));
    }

    // This single line does ALL the magic — super clean!
    // It finds the location(s) in the JSON object specified by jsonPath
    // and updates them with the parsed value (string, number, boolean, null, etc.)
    // I do not know what and how it works under the hood, but it just does! I coped it from internet.
    JSONPath({
      path: jsonPath,
      json: requestObject,
      resultType: 'value',
      wrap: false,
      callback: (val, type, full) => {
        if (full.parent) {
          full.parent[full.parentProperty] = parseSmartValue(finalValue);
        }
      }
    });
  }

  // Store the modified request object back in test data
  this.testData.set('requestObject', requestObject);

  // Attach the modified request payload for visibility
  const modifiedRequestJson = JSON.stringify(requestObject, null, 2);
  this.attach(`Modified request payload with updates:\n${modifiedRequestJson}`);
});

Then('I make a {string} call with OAuth token and capture the response', async function (this: CustomWorld, httpMethod: string) {
  // If the httpmethod is either POST or PUT or PATCH form the request body payload
  const method = httpMethod.trim().toUpperCase();
  if (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH') {
    const requestObject = this.testData.get('requestObject');
    if (!requestObject) {
      throw new Error('Request object not found in test data. Ensure that the request payload is loaded before making the API call.');
    }
    await this.restUtils.setAPIBodyPayload(requestObject);
  }

  // Retrieve the stored OAuth token from test data map
  const oauthToken = this.testData.get('OAuthToken');
  if (!oauthToken) {
    throw new Error('OAuth token not found in test data. Ensure that the token is generated before forming the client.');
  }

  // Set custom headers including the Bearer token for authorization
  const headers = {
    'Authorization': `Bearer ${oauthToken}`
  };
  await this.restUtils.setAPICustomHeaders(headers);

  // Make the API call based on the HTTP method
  let response: APIResponse;
  if (method.toUpperCase() === 'POST') {
    response = await this.restUtils.postTransaction();
  } else if (method.toUpperCase() === 'PUT') {
    response = await this.restUtils.putTransaction();
  } else if (method.toUpperCase() === 'PATCH') {
    response = await this.restUtils.patchTransaction();
  } else if (method.toUpperCase() === 'GET') {
    response = await this.restUtils.getTransaction();
  } else if (method.toUpperCase() === 'DELETE') {
    response = await this.restUtils.deleteTransaction();
  } else {
    throw new Error(`Unsupported HTTP method: ${method}`);
  }

  // Create one more custom logic for DELETE method to not expect any response body
  if (method.toUpperCase() === 'DELETE') {
    this.testData.set('actualResponseObject', null);
    this.attach(`API Response Status: ${response.status()}\nNo response body for DELETE method.`);
    return;
  }

  // Store the response object in test data for further validation
  const responseBody = await response.json();
  this.testData.set('actualResponseObject', responseBody);

  // Attach the response status and body for visibility
  const responseJson = JSON.stringify(responseBody, null, 2);
  this.attach(`API Response Status: ${response.status()}\nResponse Body:\n${responseJson}`);
});

Then('I should receive the HTTP status code in response as {int}', async function (this: CustomWorld, expectedStatusCode: number) {
  const actualStatusCode = await this.restUtils.getResponseStatusCode();
  expect(actualStatusCode).to.equal(expectedStatusCode);
  this.attach(`Verified response status code: ${actualStatusCode}`);
});

Then('I extract value from response using json path {string} and store as {string}', async function (this: CustomWorld, jsonPath: string, storeKey: string) {
  const responseObject = this.testData.get('actualResponseObject');
  if (!responseObject) {
    throw new Error('Response object not found in test data. Ensure that the response is available before extracting values.');
  }

  // Use JSONPath to extract the value
  const result = JSONPath({ path: jsonPath, json: responseObject, wrap: false });

  // Store the extracted value in test data
  this.testData.set(storeKey, result);

  // Attach the extracted value for visibility
  this.attach(`Extracted value from response using JSON path "${jsonPath}" and stored as "${storeKey}": ${JSON.stringify(result)}`);
});

Then('I form a JsonPath and verify the output object with ExpectedObject:', async function (this: CustomWorld, dataTable: DataTable) {
  const responseObject = this.testData.get('actualResponseObject');
  if (!responseObject) {
    throw new Error('Response object not found in test data. Ensure that the response is available before verification.');
  }

  const rows = dataTable.hashes();
  for (const { JsonPath: jsonPath, ExpectedObject: expectedValue } of rows) {
    // Extract actual value using JSONPath
    const actualValue = JSONPath({ path: jsonPath, json: responseObject, wrap: false });

    // Compare actual value with expected value (case-insensitive)
    if (typeof actualValue === 'string' && typeof expectedValue === 'string') {
      expect(actualValue.toLowerCase()).to.equal(expectedValue.toLowerCase());
    } else {
      expect(actualValue).to.equal(expectedValue);
    }

    // Attach verification result
    this.attach(`Verified JSON path "${jsonPath}": Expected = ${expectedValue}, Actual = ${JSON.stringify(actualValue)}`);
  }
});

Then('I form a client by manipulating the resource url with {string}', async function (this: CustomWorld, resourceUrl: string) {
  // Implement the step to form a client by manipulating the resource URL
  const manipulatedUrl = resourceUrl.replace(/{(\w+)}/g, (_, key) => {
    const value = this.testData.get(key);
    if (!value) {
      throw new Error(`Value for placeholder ${key} not found in test data.`);
    }
    return value;
  });

  await this.restUtils.setupTranResourceURL(manipulatedUrl);
  await this.restUtils.setupTranRequest();
  this.attach(`Formed client with manipulated resource URL: ${manipulatedUrl}.`);
});

Then('I validate the actual output response with expected api response', async function (this: CustomWorld) {
  const actualResponseObject = this.testData.get('actualResponseObject');
  if (!actualResponseObject) {
    throw new Error('Response object not found in test data. Ensure that the response is available before validation.');
  }
  this.attach(`Actual Response Object:\n${JSON.stringify(actualResponseObject, null, 2)}`);

  const expectedResponseObject = this.testData.get('responseObject');
  if (!expectedResponseObject) {
    throw new Error('Expected response object not found in test data. Ensure that the expected response is available before validation.');
  }
  this.attach(`Expected Response Object:\n${JSON.stringify(expectedResponseObject, null, 2)}`);

  // This deep equality check ensures that all properties and nested properties match, but ignores the order of properties.
  expect(actualResponseObject)
    .excluding(['debug_id']) // Exclude dynamic fields, but works for Top-level only
    .to.eql(expectedResponseObject);

  // This strict equality check ensures that all properties and nested properties match exactly, including the order of properties.
  // expect(actualResponseObject)
  //   .excluding(['debug_id']) // Exclude dynamic fields, but works for Top-level only
  //   .to.deep.equal(expectedResponseObject);
  this.attach(`Validated the actual response with expected response.`);
});

/**
 * Smart value parser — converts strings like "123", "true", "null" into real types
 */
function parseSmartValue(value: string): any {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  if (!isNaN(Number(value))) return Number(value);
  return value; // Return as string if no other type matches
}

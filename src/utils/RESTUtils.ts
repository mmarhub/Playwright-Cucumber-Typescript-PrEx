import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { apiConfig } from '../config/APIconfig';

/**
 * RESTUtils Class - REST API Testing Utility
 * 
 * This utility class handles all REST API operations including OAuth authentication,
 * transaction API requests (GET, POST, PUT, PATCH, DELETE), and response parsing.
 * It provides a wrapper around Playwright's APIRequestContext for centralized API request management.
 * 
 * Key Features:
 * - OAuth token generation and management
 * - Multiple HTTP method support (GET, POST, PUT, PATCH, DELETE)
 * - Centralized request/response handling
 * - Custom headers and payload management
 * - Response parsing to JSON and String formats
 */
export class RESTUtils {
  /**
   * APIRequestContext from Playwright - manages all HTTP requests and maintains session state
   */
  private apiContext: APIRequestContext;

  /**
   * Base URL for OAuth authentication endpoints
   * Example: https://oauth.github.com/
   */
  private OAuthBaseURL: string;

  /**
   * Resource URL for OAuth endpoint - gets appended to OAuthBaseURL
   * Example: login/oauth/access_token
   */
  private OAuthResourceURL!: string;

  /**
   * Base URL for Transaction/Business API endpoints
   * Example: https://api.paypal.com/
   */
  private tranBaseURL: string;

  /**
   * Resource URL for Transaction endpoint - gets appended to tranBaseURL
   * Example: /v2/checkout/orders
   */
  private tranResourceURL!: string;

  /**
   * Complete API URL (currently unused but reserved for future use)
   */
  private apiURL: string | undefined;

  /**
   * Request body payload - stores the data to be sent in POST/PUT/PATCH requests
   * Can be JSON object, form data, or any serializable data
   */
  private apiBodyPayload: any;

  /**
   * Custom HTTP headers for API requests
   * Example: { 'Content-Type': 'application/json', 'Authorization': 'Bearer token123' }
   */
  private apiCustomHeaders: Record<string, string> | undefined;

  /**
   * Stores the most recent API response for later retrieval and validation
   */
  private response: APIResponse | undefined;

  /**
   * Constructor - Initializes RESTUtils with base URLs from configuration
   * 
   * Logic:
   * - Reads OAuth and Transaction base URLs from apiConfig
   * - Initializes apiContext as null (will be set during setup phase)
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * ```
   */
  constructor() {
    this.OAuthBaseURL = apiConfig.OAuthURL;
    this.tranBaseURL = apiConfig.tranURL;
    this.apiContext = null as unknown as APIRequestContext; // Initialize to satisfy TypeScript
  }

  /**
   * Setter method for OAuth Resource URL
   * 
   * Logic:
   * - Stores the specific OAuth endpoint path that will be appended to the base OAuth URL
   * - This method must be called after constructor but before setupOAuthRequest()
   * 
   * @param resourceURL - The endpoint path for OAuth (e.g., 'login/oauth/access_token')
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * await restUtils.setupOAuthResourceURL('login/oauth/access_token');
   * ```
   */
  // setup the Oauth resource URL
  async setupOAuthResourceURL(resourceURL: string): Promise<void> {
    this.OAuthResourceURL = resourceURL;
  }

  /**
   * Setter method for Transaction Resource URL
   * 
   * Logic:
   * - Stores the specific transaction/business API endpoint path
   * - This method must be called after constructor but before setupTranRequest()
   * 
   * @param resourceURL - The endpoint path for Transaction API (e.g., '/v2/checkout/orders')
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * await restUtils.setupTranResourceURL('/v2/checkout/orders');
   * ```
   */
  // setup the Transaction resource URL
  async setupTranResourceURL(resourceURL: string): Promise<void> {
    this.tranResourceURL = resourceURL;
  }

  /**
   * Setter method for API request body payload
   * 
   * Logic:
   * - Stores the request payload data that will be sent in POST, PUT, or PATCH requests
   * - This method should be called before making any request that requires a body
   * - Supports any serializable data format (JSON, form data, etc.)
   * 
   * @param payload - The request body data to be sent in the API call
   * 
   * Usage Example:
   * ```typescript
   * const requestPayload = {
   *   orderID: '12345',
   *   action: 'CAPTURE',
   *   amount: { value: '100.00', currency_code: 'USD' }
   * };
   * await restUtils.setAPIBodyPayload(requestPayload);
   * ```
   */
  // Set the API request body payload
  async setAPIBodyPayload(payload: any): Promise<void> {
    this.apiBodyPayload = payload;
  }

  /**
   * Setter method for custom HTTP headers
   * 
   * Logic:
   * - Stores custom headers that will be included in the API request
   * - These headers override or supplement default headers set during API context setup
   * - Essential for authentication tokens, content-type, and custom API requirements
   * - This method should be called before making any API request
   * 
   * @param headers - Key-value pair object containing HTTP headers
   * 
   * Usage Example:
   * ```typescript
   * const customHeaders = {
   *   'Content-Type': 'application/json',
   *   'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
   *   'PayPal-Auth-Assertion': 'assertionToken123'
   * };
   * await restUtils.setAPICustomHeaders(customHeaders);
   * ```
   */
  // Set the custom headers for the API request
  async setAPICustomHeaders(headers: Record<string, string>): Promise<void> {
    this.apiCustomHeaders = headers;
  }

  /**
   * Initialize OAuth API request context
   * 
   * Logic:
   * - Creates a new APIRequestContext specifically configured for OAuth endpoints
   * - Sets up the complete URL by combining OAuthBaseURL + OAuthResourceURL
   * - Applies OAuth-specific headers from apiConfig.OAuthAPIheaders
   * - Sets request timeout from apiConfig.timeout
   * - This method MUST be called before making any OAuth requests
   * - Should be called after setupOAuthResourceURL() to ensure resource URL is set
   * 
   * Return: void - The context is stored internally and used by subsequent OAuth calls
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * await restUtils.setupOAuthResourceURL('login/oauth/access_token');
   * await restUtils.setupOAuthRequest();
   * const tokenResponse = await restUtils.getOAuthToken(clientId, clientSecret);
   * ```
   */
  // Initialize the OAuth API request context
  async setupOAuthRequest(): Promise<void> {
    this.apiContext = await request.newContext({
      baseURL: this.OAuthBaseURL + this.OAuthResourceURL,
      timeout: apiConfig.timeout,
      extraHTTPHeaders: apiConfig.OAuthAPIheaders,
    });
  }

  /**
   * Initialize Transaction API request context
   * 
   * Logic:
   * - Creates a new APIRequestContext specifically configured for Transaction/Business API endpoints
   * - Sets up the complete URL by combining tranBaseURL + tranResourceURL
   * - Applies transaction-specific headers from apiConfig.tranAPIheaders
   * - Sets request timeout from apiConfig.timeout
   * - This method MUST be called before making any transaction requests (POST, GET, PUT, PATCH, DELETE)
   * - Should be called after setupTranResourceURL() to ensure resource URL is set
   * 
   * Return: void - The context is stored internally and used by subsequent transaction API calls
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * await restUtils.setupTranResourceURL('/v2/checkout/orders');
   * await restUtils.setupTranRequest();
   * await restUtils.setAPIBodyPayload(orderPayload);
   * const response = await restUtils.postTransaction();
   * ```
   */
  // Initialize the Transaction API request context
  async setupTranRequest(): Promise<void> {
    this.apiContext = await request.newContext({
      baseURL: this.tranBaseURL + this.tranResourceURL,
      timeout: apiConfig.timeout,
      extraHTTPHeaders: apiConfig.tranAPIheaders,
    });
  }

  /**
   * Getter method for the internal API request context
   * 
   * Logic:
   * - Returns the currently initialized APIRequestContext
   * - Validates that context exists before returning (prevents null reference errors)
   * - Throws an error if context is not initialized (must call setupOAuthRequest or setupTranRequest first)
   * - Used primarily for advanced scenarios where direct context access is needed
   * 
   * Return: APIRequestContext - The Playwright request context object
   * 
   * Throws: Error if apiContext was never initialized
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * await restUtils.setupOAuthRequest();
   * const context = restUtils.getAPIContext();
   * // Now you can use context for advanced operations if needed
   * ```
   */
  // Get the current API request context
  getAPIContext(): APIRequestContext {
    if (!this.apiContext) {
      throw new Error('API context is not initialized. Call setupOAuthURL or setupTranURL first.');
    }
    return this.apiContext;
  }

  /**
   * Retrieve OAuth Token from OAuth Provider
   * 
   * Logic:
   * - Combines clientId and clientSecret into format "clientId:clientSecret"
   * - Encodes the combined string into Base64 format (OAuth 2.0 Basic Auth requirement)
   * - Sends POST request to OAuth endpoint with Basic Authorization header
   * - Includes OAuth body form data from apiConfig (typically grant_type='client_credentials')
   * - Validates response status (throws error if not 2xx)
   * - Stores response for retrieval by getResponseBody() or other response getters
   * - The token from response is typically used in subsequent API requests
   * 
   * @param clientId - OAuth application client ID
   * @param clientSecret - OAuth application client secret
   * 
   * Return: APIResponse - The complete OAuth provider response containing the access token
   * 
   * Throws: Error if HTTP status is not OK (2xx)
   * 
   * Prerequisites:
   * - setupOAuthResourceURL() must be called first
   * - setupOAuthRequest() must be called first
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * await restUtils.setupOAuthResourceURL('login/oauth/access_token');
   * await restUtils.setupOAuthRequest();
   * 
   * const tokenResponse = await restUtils.getOAuthToken('myClientId', 'myClientSecret');
   * const tokenData = await restUtils.getResponseBody();
   * // tokenData typically contains: { access_token: 'abc123...', token_type: 'Bearer', expires_in: 3600 }
   * const accessToken = tokenData.access_token;
   * ```
   */
  // Get Oauth token from the OAuth API with clinet id and client secret
  async getOAuthToken(clientId: string, clientSecret: string): Promise<APIResponse> {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    this.response = await this.apiContext.post('', {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      data: apiConfig.OAuthBodyForm,
    });

    if (!this.response.ok()) {
      throw new Error(`Failed to get OAuth token: ${this.response.status()} - ${this.response.statusText()}`);
    }

    return this.response;
  }

  /**
   * Perform POST request to Transaction API
   * 
   * Logic:
   * - Sends HTTP POST request to the configured transaction endpoint
   * - Includes custom headers (set via setAPICustomHeaders) - typically contains authorization token
   * - Includes request body payload (set via setAPIBodyPayload)
   * - Does NOT throw error on non-2xx responses (allows negative test case validation)
   * - Stores response internally for retrieval via response getter methods
   * - Used for creating new resources (orders, transactions, payments, etc.)
   * 
   * Return: APIResponse - The complete response object containing status, headers, body
   * 
   * Prerequisites:
   * - setupTranResourceURL() must be called
   * - setupTranRequest() must be called
   * - setAPIBodyPayload() should be called to set the request body
   * - setAPICustomHeaders() should be called to set authorization headers
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * await restUtils.setupTranResourceURL('/v2/checkout/orders');
   * await restUtils.setupTranRequest();
   * 
   * const orderPayload = {
   *   intent: 'CAPTURE',
   *   purchase_units: [{ amount: { currency_code: 'USD', value: '100.00' } }]
   * };
   * 
   * const headers = {
   *   'Content-Type': 'application/json',
   *   'Authorization': `Bearer ${accessToken}`
   * };
   * 
   * await restUtils.setAPIBodyPayload(orderPayload);
   * await restUtils.setAPICustomHeaders(headers);
   * const response = await restUtils.postTransaction();
   * 
   * const statusCode = await restUtils.getResponseStatusCode(); // e.g., 201
   * const responseBody = await restUtils.getResponseBody(); // { id: '...' }
   * ```
   */
  // Perform a POST request to the Transaction API
  async postTransaction(): Promise<APIResponse> {
    this.response = await this.apiContext.post('', {
      headers: this.apiCustomHeaders,
      data: this.apiBodyPayload,
    });

    // commenting the below line to allow negative test cases
    // if (!this.response.ok()) {
    //   throw new Error(`Transaction API POST request failed: ${this.response.status()} - ${this.response.statusText()}`);
    // }

    return this.response;
  }

  /**
   * Perform GET request to Transaction API
   * 
   * Logic:
   * - Sends HTTP GET request to the configured transaction endpoint
   * - Includes custom headers (set via setAPICustomHeaders) - typically contains authorization token
   * - No request body is sent (GET requests don't have a body)
   * - Does NOT throw error on non-2xx responses (allows negative test case validation)
   * - Stores response internally for retrieval via response getter methods
   * - Used for fetching resource details or listing resources
   * 
   * Return: APIResponse - The complete response object containing status, headers, body
   * 
   * Prerequisites:
   * - setupTranResourceURL() must be called
   * - setupTranRequest() must be called
   * - setAPICustomHeaders() should be called to set authorization headers
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * await restUtils.setupTranResourceURL('/v2/checkout/orders/{orderId}');
   * await restUtils.setupTranRequest();
   * 
   * const headers = {
   *   'Authorization': `Bearer ${accessToken}`
   * };
   * 
   * await restUtils.setAPICustomHeaders(headers);
   * const response = await restUtils.getTransaction();
   * 
   * if (await restUtils.getResponseStatusCode() === 200) {
   *   const orderDetails = await restUtils.getResponseBody();
   *   console.log('Order Status:', orderDetails.status); // e.g., "CREATED", "APPROVED"
   * }
   * ```
   */
  // Perform a GET request to the Transaction API
  async getTransaction(): Promise<APIResponse> {
    this.response = await this.apiContext.get('', {
      headers: this.apiCustomHeaders,
    });

    // commenting the below line to allow negative test cases
    // if (!this.response.ok()) {
    //   throw new Error(`Transaction API GET request failed: ${this.response.status()} - ${this.response.statusText()}`);
    // }

    return this.response;
  }

  /**
   * Perform PUT request to Transaction API
   * 
   * Logic:
   * - Sends HTTP PUT request to the configured transaction endpoint
   * - Includes custom headers (set via setAPICustomHeaders) - typically contains authorization token
   * - Includes request body payload (set via setAPIBodyPayload) - used to replace entire resource
   * - Does NOT throw error on non-2xx responses (allows negative test case validation)
   * - Stores response internally for retrieval via response getter methods
   * - Used for replacing entire resource (complete update)
   * - Difference from PATCH: PUT replaces all fields, PATCH updates only specified fields
   * 
   * Return: APIResponse - The complete response object containing status, headers, body
   * 
   * Prerequisites:
   * - setupTranResourceURL() must be called
   * - setupTranRequest() must be called
   * - setAPIBodyPayload() should be called to set the new resource data
   * - setAPICustomHeaders() should be called to set authorization headers
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * await restUtils.setupTranResourceURL('/v2/checkout/orders/{orderId}');
   * await restUtils.setupTranRequest();
   * 
   * const updatedPayload = {
   *   intent: 'CAPTURE',
   *   purchase_units: [{ amount: { currency_code: 'USD', value: '150.00' } }]
   * };
   * 
   * const headers = {
   *   'Content-Type': 'application/json',
   *   'Authorization': `Bearer ${accessToken}`
   * };
   * 
   * await restUtils.setAPIBodyPayload(updatedPayload);
   * await restUtils.setAPICustomHeaders(headers);
   * const response = await restUtils.putTransaction();
   * 
   * const statusCode = await restUtils.getResponseStatusCode(); // e.g., 200
   * ```
   */
  // Perform a PUT request to the Transaction API
  async putTransaction(): Promise<APIResponse> {
    this.response = await this.apiContext.put('', {
      headers: this.apiCustomHeaders,
      data: this.apiBodyPayload,
    });

    // commenting the below line to allow negative test cases
    // if (!this.response.ok()) {
    //   throw new Error(`Transaction API PUT request failed: ${this.response.status()} - ${this.response.statusText()}`);
    // }

    return this.response;
  }

  /**
   * Perform PATCH request to Transaction API
   * 
   * Logic:
   * - Sends HTTP PATCH request to the configured transaction endpoint
   * - Includes custom headers (set via setAPICustomHeaders) - typically contains authorization token
   * - Includes request body payload (set via setAPIBodyPayload) - used to update specific fields only
   * - Does NOT throw error on non-2xx responses (allows negative test case validation)
   * - Stores response internally for retrieval via response getter methods
   * - Used for partial resource updates (only specified fields are updated)
   * - Difference from PUT: PATCH updates only specified fields, PUT replaces entire resource
   * 
   * Return: APIResponse - The complete response object containing status, headers, body
   * 
   * Prerequisites:
   * - setupTranResourceURL() must be called
   * - setupTranRequest() must be called
   * - setAPIBodyPayload() should be called with only the fields to be updated
   * - setAPICustomHeaders() should be called to set authorization headers
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * await restUtils.setupTranResourceURL('/v2/checkout/orders/{orderId}');
   * await restUtils.setupTranRequest();
   * 
   * // Only updating the amount, other fields remain unchanged
   * const patchPayload = [
   *   {
   *     op: 'replace',
   *     path: '/purchase_units/0/amount/value',
   *     value: '200.00'
   *   }
   * ];
   * 
   * const headers = {
   *   'Content-Type': 'application/json-patch+json',
   *   'Authorization': `Bearer ${accessToken}`
   * };
   * 
   * await restUtils.setAPIBodyPayload(patchPayload);
   * await restUtils.setAPICustomHeaders(headers);
   * const response = await restUtils.patchTransaction();
   * 
   * const statusCode = await restUtils.getResponseStatusCode(); // e.g., 204 (No Content)
   * ```
   */
  // Perform a PATCH request to the Transaction API
  async patchTransaction(): Promise<APIResponse> {
    this.response = await this.apiContext.patch('', {
      headers: this.apiCustomHeaders,
      data: this.apiBodyPayload,
    });

    // commenting the below line to allow negative test cases
    // if (!this.response.ok()) {
    //   throw new Error(`Transaction API PATCH request failed: ${this.response.status()} - ${this.response.statusText()}`);
    // }

    return this.response;
  }

  /**
   * Perform DELETE request to Transaction API
   * 
   * Logic:
   * - Sends HTTP DELETE request to the configured transaction endpoint
   * - Includes custom headers (set via setAPICustomHeaders) - typically contains authorization token
   * - No request body is sent (DELETE requests typically don't have a body)
   * - THROWS error on non-2xx responses (unlike other methods, this one validates success)
   * - Stores response internally for retrieval via response getter methods
   * - Used for deleting resources
   * - This is the only transaction method that validates response success
   * 
   * Return: APIResponse - The complete response object containing status, headers, body
   * 
   * Throws: Error if HTTP status is not OK (2xx)
   * 
   * Prerequisites:
   * - setupTranResourceURL() must be called
   * - setupTranRequest() must be called
   * - setAPICustomHeaders() should be called to set authorization headers
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * await restUtils.setupTranResourceURL('/v2/checkout/orders/{orderId}');
   * await restUtils.setupTranRequest();
   * 
   * const headers = {
   *   'Authorization': `Bearer ${accessToken}`
   * };
   * 
   * await restUtils.setAPICustomHeaders(headers);
   * 
   * try {
   *   const response = await restUtils.deleteTransaction();
   *   const statusCode = await restUtils.getResponseStatusCode(); // e.g., 204
   *   console.log('Resource deleted successfully');
   * } catch (error) {
   *   console.error('Delete failed:', error);
   * }
   * ```
   */
  // Perform a DELETE request to the Transaction API
  async deleteTransaction(): Promise<APIResponse> {
    this.response = await this.apiContext.delete('', {
      headers: this.apiCustomHeaders,
    });

    if (!this.response.ok()) {
      throw new Error(`Transaction API DELETE request failed: ${this.response.status()} - ${this.response.statusText()}`);
    }

    return this.response;
  }

  /**
   * Retrieve HTTP status code from the last API response
   * 
   * Logic:
   * - Returns the numeric HTTP status code (e.g., 200, 201, 400, 401, 404, 500)
   * - Validates that a response exists (must call an API method first)
   * - Throws error if called before any API request has been made
   * - Essential for response validation in test assertions
   * 
   * Return: number - HTTP status code (200, 201, 400, 401, 403, 404, 422, 500, etc.)
   * 
   * Throws: Error if no response is available
   * 
   * Prerequisites:
   * - An API request must be executed first (postTransaction, getTransaction, etc.)
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * // ... setup and execute transaction ...
   * await restUtils.postTransaction();
   * 
   * const statusCode = await restUtils.getResponseStatusCode();
   * if (statusCode === 201) {
   *   console.log('Order created successfully');
   * } else if (statusCode === 400) {
   *   console.log('Bad request - check payload');
   * } else if (statusCode === 401) {
   *   console.log('Unauthorized - invalid token');
   * }
   * 
   * // In BDD/Cucumber step:
   * expect(statusCode).toBe(201);
   * ```
   */
  // Get the API response status code
  async getResponseStatusCode(): Promise<number> {
    if (!this.response) {
      throw new Error('Response is not available. Make sure to perform an API call before getting the status code.');
    }
    return this.response.status();
  }

  /**
   * Retrieve HTTP status text from the last API response
   * 
   * Logic:
   * - Returns the HTTP status message text (e.g., 'OK', 'Created', 'Bad Request', 'Unauthorized', 'Not Found')
   * - Validates that a response exists (must call an API method first)
   * - Throws error if called before any API request has been made
   * - Useful for debugging and detailed error reporting
   * 
   * Return: string - HTTP status text corresponding to the status code
   *   - 200 returns 'OK'
   *   - 201 returns 'Created'
   *   - 204 returns 'No Content'
   *   - 400 returns 'Bad Request'
   *   - 401 returns 'Unauthorized'
   *   - 403 returns 'Forbidden'
   *   - 404 returns 'Not Found'
   *   - 500 returns 'Internal Server Error'
   * 
   * Throws: Error if no response is available
   * 
   * Prerequisites:
   * - An API request must be executed first (postTransaction, getTransaction, etc.)
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * // ... setup and execute transaction ...
   * await restUtils.postTransaction();
   * 
   * const statusText = await restUtils.getResponseStatusLine();
   * console.log('Response Status:', statusText); // e.g., 'Created'
   * 
   * // Useful in error scenarios:
   * const statusCode = await restUtils.getResponseStatusCode();
   * if (statusCode >= 400) {
   *   const errorMessage = await restUtils.getResponseStatusLine();
   *   throw new Error(`API Error:${statusCode} ${errorMessage}`);
   * }
   * ```
   */
  // Get the API response status line
  async getResponseStatusLine(): Promise<string> {
    if (!this.response) {
      throw new Error('Response is not available. Make sure to perform an API call before getting the status line.');
    }
    return this.response.statusText();
  }

  /**
   * Retrieve API response body as parsed JSON
   * 
   * Logic:
   * - Parses the response body as JSON and returns as JavaScript object
   * - Validates that a response exists (must call an API method first)
   * - Throws error if called before any API request has been made
   * - Throws error if response body is not valid JSON
   * - Most commonly used method for extracting response data
   * - Allows direct access to response properties and nested objects
   * 
   * Return: any - The parsed JSON response body as an object
   *   - OAuth response: { access_token: '...', token_type: 'Bearer', expires_in: 3600 }
   *   - Transaction POST response: { id: 'ORDER-123', status: 'CREATED', ... }
   *   - Transaction GET response: { id: 'ORDER-123', status: 'APPROVED', payer: {...}, ... }
   * 
   * Throws: Error if no response is available or if response is not valid JSON
   * 
   * Prerequisites:
   * - An API request must be executed first (postTransaction, getTransaction, etc.)
   * - Response content-type must be application/json
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * // ... setup OAuth request ...
   * await restUtils.getOAuthToken(clientId, clientSecret);
   * 
   * const tokenData = await restUtils.getResponseBody();
   * const accessToken = tokenData.access_token;
   * const expiresIn = tokenData.expires_in; // e.g., 3600 seconds
   * 
   * // For transaction responses:
   * await restUtils.postTransaction();
   * const orderData = await restUtils.getResponseBody();
   * const orderId = orderData.id;
   * const orderStatus = orderData.status;
   * 
   * // Extracting nested data:
   * const payerName = orderData.payer?.name?.given_name;
   * const transactions = orderData.purchase_units?.[0]?.payments?.captures;
   * 
   * // In test assertions:
   * expect(orderData).toHaveProperty('id');
   * expect(orderData.status).toBe('CREATED');
   * ```
   */
  // Get the API response body as JSON
  async getResponseBody(): Promise<any> {
    if (!this.response) {
      throw new Error('Response is not available. Make sure to perform an API call before getting the response body.');
    }
    return this.response.json();
  }

  /**
   * Retrieve API response body as raw string
   * 
   * Logic:
   * - Returns the response body as unparsed text/string
   * - Validates that a response exists (must call an API method first)
   * - Throws error if called before any API request has been made
   * - Useful for non-JSON responses or when raw content is needed
   * - Allows manual parsing or regex matching on response content
   * - Helpful for responses that may contain XML, HTML, or plain text
   * 
   * Return: string - The raw response body as text
   * 
   * Throws: Error if no response is available
   * 
   * Prerequisites:
   * - An API request must be executed first (postTransaction, getTransaction, etc.)
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * // ... setup and execute API request ...
   * await restUtils.getTransaction();
   * 
   * // Get raw response as string
   * const responseText = await restUtils.getResponseAsString();
   * console.log('Raw Response:', responseText);
   * 
   * // When response is JSON - can parse manually if needed
   * const jsonData = JSON.parse(responseText);
   * 
   * // When response may contain XML or other formats
   * if (responseText.includes('<xml>')) {
   *   // Handle XML response
   * }
   * 
   * // Regex matching on response content:
   * if (responseText.match(/error|failed/i)) {
   *   console.log('Error found in response');
   * }
   * 
   * // Logging or debugging scenarios:
   * console.log('Full Response Text:\\n', responseText);
   * ```
   */
  // Get the API response as string
  async getResponseAsString(): Promise<string> {
    if (!this.response) {
      throw new Error('Response is not available. Make sure to perform an API call before getting the response as string.');
    }
    return this.response.text();
  }

  /**
   * Cleanup and dispose the API request context
   * 
   * Logic:
   * - Properly closes and releases the APIRequestContext resource
   * - Cleans up all active connections and sessions
   * - Must be called after all API requests are complete
   * - Prevents resource leaks and ensures clean test teardown
   * - Validates that context exists before attempting disposal
   * - Typically called in test cleanup/teardown hooks
   * 
   * Return: void - No return value, just performs cleanup
   * 
   * Prerequisites:
   * - setupOAuthRequest() or setupTranRequest() must have been called first
   * - Should be called after all API operations are complete
   * 
   * Best Practice: Always call this method in test teardown/cleanup
   * 
   * Usage Example:
   * ```typescript
   * const restUtils = new RESTUtils();
   * 
   * try {
   *   // Setup
   *   await restUtils.setupOAuthResourceURL('login/oauth/access_token');
   *   await restUtils.setupOAuthRequest();
   *   
   *   // API calls
   *   await restUtils.getOAuthToken(clientId, clientSecret);
   *   const tokenData = await restUtils.getResponseBody();
   *   
   *   // Use token for transaction requests
   *   // ... more API calls ...
   *   
   * } finally {
   *   // Always cleanup
   *   await restUtils.disposeAPIContext();
   * }
   * 
   * // In BDD hooks (hooks.ts):
   * After(async function() {
   *   await restUtils.disposeAPIContext();
   * });
   * ```
   */
  // Dispose the API request context
  async disposeAPIContext(): Promise<void> {
    if (this.apiContext) {
      await this.apiContext.dispose();
    }
  }
}

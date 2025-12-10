import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { apiConfig } from '../config/APIconfig';

export class RESTUtils {
  private apiContext: APIRequestContext;
  private OAuthBaseURL: string;
  private OAuthResourceURL!: string;
  private tranBaseURL: string;
  private tranResourceURL!: string;
  private apiURL: string | undefined;
  private apiBodyPayload: any;
  private apiCustomHeaders: Record<string, string> | undefined;
  private response: APIResponse | undefined;

  constructor() {
    this.OAuthBaseURL = apiConfig.OAuthURL;
    this.tranBaseURL = apiConfig.tranURL;
    this.apiContext = null as unknown as APIRequestContext; // Initialize to satisfy TypeScript
  }

  // setup the Oauth resource URL
  async setupOAuthResourceURL(resourceURL: string): Promise<void> {
    this.OAuthResourceURL = resourceURL;
  }

  // setup the Transaction resource URL
  async setupTranResourceURL(resourceURL: string): Promise<void> {
    this.tranResourceURL = resourceURL;
  }

  // Set the API request body payload
  async setAPIBodyPayload(payload: any): Promise<void> {
    this.apiBodyPayload = payload;
  }

  // Set the custom headers for the API request
  async setAPICustomHeaders(headers: Record<string, string>): Promise<void> {
    this.apiCustomHeaders = headers;
  }

  // Initialize the OAuth API request context
  async setupOAuthRequest(): Promise<void> {
    this.apiContext = await request.newContext({
      baseURL: this.OAuthBaseURL + this.OAuthResourceURL,
      timeout: apiConfig.timeout,
      extraHTTPHeaders: apiConfig.OAuthAPIheaders,
    });
  }

  // Initialize the Transaction API request context
  async setupTranRequest(): Promise<void> {
    this.apiContext = await request.newContext({
      baseURL: this.tranBaseURL + this.tranResourceURL,
      timeout: apiConfig.timeout,
      extraHTTPHeaders: apiConfig.tranAPIheaders,
    });
  }

  // Get the current API request context
  getAPIContext(): APIRequestContext {
    if (!this.apiContext) {
      throw new Error('API context is not initialized. Call setupOAuthURL or setupTranURL first.');
    }
    return this.apiContext;
  }

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

  // Get the API response status code
  async getResponseStatusCode(): Promise<number> {
    if (!this.response) {
      throw new Error('Response is not available. Make sure to perform an API call before getting the status code.');
    }
    return this.response.status();
  }

  // Get the API response status line
  async getResponseStatusLine(): Promise<string> {
    if (!this.response) {
      throw new Error('Response is not available. Make sure to perform an API call before getting the status line.');
    }
    return this.response.statusText();
  }

  // Get the API response body as JSON
  async getResponseBody(): Promise<any> {
    if (!this.response) {
      throw new Error('Response is not available. Make sure to perform an API call before getting the response body.');
    }
    return this.response.json();
  }

  // Get the API response as string
  async getResponseAsString(): Promise<string> {
    if (!this.response) {
      throw new Error('Response is not available. Make sure to perform an API call before getting the response as string.');
    }
    return this.response.text();
  }

  // Dispose the API request context
  async disposeAPIContext(): Promise<void> {
    if (this.apiContext) {
      await this.apiContext.dispose();
    }
  }
}

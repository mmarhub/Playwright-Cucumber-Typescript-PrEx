// src/config/api-config.ts
import * as dotenv from 'dotenv';

dotenv.config();

export interface ApiConfig {
  OAuthURL: string;
  tranURL: string;
  timeout: number;
  OAuthAPIheaders: Record<string, string>;
  tranAPIheaders: Record<string, string>;
  OAuthBodyForm?: any;
  auth?: {
    username?: string;
    password?: string;
    token?: string;
  };
}

export const apiConfig: ApiConfig = {
  OAuthURL: process.env.OAUTH_API_URL || 'https://api-m.sandbox.paypal.com',
  tranURL: process.env.TRANSACTION_API_URL || 'https://api-m.sandbox.paypal.com',
  timeout: parseInt(process.env.API_TIMEOUT || '30000'),
  OAuthAPIheaders: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  tranAPIheaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  OAuthBodyForm: process.env.OAUTH_BODY_FORM || 'grant_type=client_credentials',
  auth: {
    username: process.env.API_USERNAME,
    password: process.env.API_PASSWORD,
    token: process.env.API_TOKEN,
  },
};

/**
 * Configuration Management
 * 
 * This file centralizes all configuration settings for the framework.
 * It reads values from environment variables (.env file) and provides
 * type-safe access to configuration throughout the framework.
 * 
 * Benefits:
 * - Single source of truth for configuration
 * - Easy to change settings without modifying code
 * - Different configs for different environments (dev/test/prod)
 */

import * as dotenv from 'dotenv';
import { LaunchOptions } from '@playwright/test';

// Load environment variables from .env file into process.env
dotenv.config();

/**
 * Interface defining the structure of our test configuration
 * This ensures type safety when accessing config values
 */
export interface TestConfig {
  baseUrl: string;                                    // Application URL
  browser: 'chromium' | 'firefox' | 'webkit';         // Browser type
  headless: boolean;                                  // Run with/without UI
  timeout: number;                                    // Default timeout in ms
  screenshotOnFailure: boolean;                       // Capture screenshot on failure
  launchOptions: LaunchOptions;                       // Additional browser launch options
}

/**
 * Main configuration object
 * Uses values from .env file, with fallback defaults if not specified
 * 
 * Example: process.env.BASE_URL reads BASE_URL from .env file
 * If not found, uses 'https://github.com' as default
 */
export const config: TestConfig = {
  // Read BASE_URL from environment, default to 'https://github.com'
  baseUrl: process.env.BASE_URL || 'https://github.com',
  
  // Cast browser type with type assertion for TypeScript safety
  browser: (process.env.BROWSER as 'chromium' | 'firefox' | 'webkit') || 'chromium',
  
  // Convert string 'true'/'false' to boolean
  headless: process.env.HEADLESS === 'true',
  
  // Convert string to number using parseInt, default to 30000ms (30 seconds)
  timeout: parseInt(process.env.TIMEOUT || '30000', 10),
  
  // Convert string to boolean for screenshot setting
  screenshotOnFailure: process.env.SCREENSHOT_ON_FAILURE === 'true',
  
  // Additional options passed to browser when launching
  launchOptions: {
    slowMo: 0,                        // Delay in ms between operations (0 = no delay)
    args: ['--start-maximized'],      // Browser command-line arguments
  }
};

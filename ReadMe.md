# Playwright Cucumber TypeScript Test Automation Framework

## 🎯 What is this framework?

This is a **BDD (Behavior-Driven Development)** test automation framework that combines:
- **Playwright**: Modern browser automation (better than Selenium)
- **Cucumber**: BDD framework for writing tests in plain English
- **TypeScript**: JavaScript with type safety (catches errors before runtime)

## ✨ Features

- ✅ **Page Object Model (POM)**: Clean separation of test code and page code
- ✅ **Parallel execution**: Run tests faster using multiple threads
- ✅ **Thread-safe**: Each scenario gets isolated browser and data
- ✅ **TypeScript**: Strong typing prevents bugs
- ✅ **Pretty reports**: Beautiful HTML reports with screenshots
- ✅ **Screenshot on failure**: Automatic debugging evidence
- ✅ **Reusable code**: BasePage class and utility functions
- ✅ **Environment config**: Easy to switch between dev/test/prod

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm (comes with Node.js)

### Steps
```bash
# 1. Clone the repository (if using Git)
git clone <repository-url>

# 2. Navigate to project directory
cd playwright-cucumber-framework

# 3. Install all dependencies
npm install

# This installs:
# - Playwright (with browsers)
# - Cucumber
# - TypeScript
# - All other packages from package.json
```

## 🚀 Running Tests

```bash
# Run all tests (sequential) - Automatically cleans previous results and Generate HTML reports
npm run test

# Run tests in parallel (3 workers - faster!)
npm run test:parallel

# Run only tests with specific tag
npm run test:smoke          # Runs all @smoke tagged scenarios
npm run test:login          # Runs all @login tagged scenarios
npm run test:pricing       # Runs all @pricing tagged scenarios

# Run with custim tags
npm run test:tag -- "@wip"  # Runs only @wip ragged scenarios
npm run test:tag -- "@wip or @smoke"  # Runs scenarios tagged with either of one

# Generate HTML report after tests
npm run report

# Clean previous test results manually (without running tests)
npm run clean
```


## 📁 Project Structure

```
playwright-cucumber-framework/
│
├── src/
│   ├── config/              # Configuration files
│   │   └── config.ts        # Environment settings (URL, browser, etc.)
│   │
│   ├── pages/               # Page Object Model classes
│   │   ├── BasePage.ts      # Parent class with common methods
│   │   ├── LoginPage.ts     # Login page actions
│   │   └── HomePage.ts      # Home page actions
│   │
│   ├── steps/               # Step definitions (Gherkin → Code)
│   │   └── login.steps.ts   # Login step implementations
│   │
│   ├── hooks/               # Cucumber hooks (setup/teardown)
│   │   └── hooks.ts         # Before/After scenario logic
│   │
│   ├── utils/               # Utility classes and scripts
│   │   ├── BrowserManager.ts  # Browser lifecycle management
│   │   ├── World.ts          # Cucumber World (shared context)
│   │   └── env-util.ts        # Get or Store any dataset
│   │
│   └── reports/             # Report generation
│       └── generate-report.js  # HTML report generator
│
├── features/                # Gherkin feature files
│   └── login.feature        # Login test scenarios
│
├── reports/                 # Test outputs (generated & auto-cleaned)
│   ├── screenshots/         # Failure screenshots
│   ├── videos/              # Test execution videos
│   ├── traces/              # Playwright traces
│   └── html-report/         # Pretty HTML reports
│
├── .env                     # Environment variables
├── cucumber.js              # Cucumber configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies and scripts
```

## 🔧 Configuration

### Environment Variables (.env file)
```bash
BASE_URL=https://example.com     # Application URL
BROWSER=chromium                  # Browser: chromium/firefox/webkit
HEADLESS=true                     # Headless mode (true/false)
TIMEOUT=30000                     # Default timeout (milliseconds)
SCREENSHOT_ON_FAILURE=true        # Auto-screenshot on fail
```

### Change Browser
```bash
# Edit .env file:
BROWSER=firefox    # or webkit for Safari
```

### Change Parallel Workers
```bash
# Edit cucumber.js:
parallel: 5  # Run 5 scenarios at once
```

## 📝 Writing Tests

### 1. Create Feature File (features/example.feature)
```gherkin
Feature: Example Feature

  @smoke
  Scenario: Example test
    Given I am on the home page
    When I click the button
    Then I should see the result
```

### 2. Create Page Object (src/pages/ExamplePage.ts)
```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { BrowserManager } from '../utils/BrowserManager';

export class ExamplePage extends BasePage {
  private readonly button: Locator;
  
  constructor(browserManager: BrowserManager) {
    super(browserManager);
    this.button = this.page.locator('#myButton');
  }
  
  async clickButton(): Promise<void> {
    await this.clickElement(this.button);
  }
}
```

### 3. Add to World (src/utils/World.ts)
```typescript
// Add getter:
get examplePage(): ExamplePage {
  if (!this._examplePage) {
    if (!this.browserManager.getPage()) throw new Error('Page not initialized');
    this._examplePage = new ExamplePage(this.browserManager!);
  }
  return this._examplePage;
}
```

### 4. Create Step Definitions (src/steps/example.steps.ts)
```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../utils/World';

Given('I am on the home page', async function(this: CustomWorld) {
  await this.examplePage.navigate('/');
});

When('I click the button', async function(this: CustomWorld) {
  await this.examplePage.clickButton();
});
```

### Run in Headed Mode
```bash
# Edit .env:
HEADLESS=false
```

### Additional Attachments

You can attach other data to reports in step definitions:

```typescript
// Attach text
await this.attach('Additional debug info', 'text/plain');

// Attach JSON
await this.attach(JSON.stringify({ user: 'test', id: 123 }), 'application/json');

// Attach screenshot manually
const screenshot = await this.page.screenshot();
await this.attach(screenshot, 'image/png');
```

## 📚 Additional Resources

- [Playwright Docs](https://playwright.dev)
- [Cucumber Docs](https://cucumber.io/docs/cucumber/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Happy Testing! 🎉**

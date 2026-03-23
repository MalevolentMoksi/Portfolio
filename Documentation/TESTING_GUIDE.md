# Testing Guide

This document describes the testing strategy and procedures for the PORTFOLIO project.

## Overview
We employ a comprehensive testing strategy that covers:
1. **Unit & Integration Tests**: Validating isolated logic and component interactions using Vitest and React Testing Library.
2. **End-to-End (E2E) & Visual Tests**: Verifying critical user journeys and UI consistency using Playwright.
3. **Accessibility (a11y) Tests**: Automated with Axe-core via Playwright to ensure WCAG 2.1 AA compliance.
4. **Performance Tests**: Ensuring Lightouse scores and core web vitals remain high.

## Running Tests Locally

### Prerequisites
Make sure dependencies are installed:
```bash
npm install
```

For E2E tests, install Playwright browsers:
```bash
npx playwright install
```

### Unit & Integration Tests
Run all unit and integration tests using Vitest:
```bash
# Run tests once
npm run test

# Run in watch mode (for development)
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### E2E, Accessibility, and Visual Tests
Run all Playwright tests (E2E, visual regression, accessibility):
```bash
# Run all tests headlessly
npm run test:e2e

# Open Playwright UI to interactively run and debug tests
npm run test:e2e:ui
```

### Interpreting Reports
- **Vitest Coverage**: After running `npm run test:coverage`, check the `coverage/` directory. Open `coverage/index.html` in your browser for a detailed view. We target a minimum of 80% coverage.
- **Playwright Report**: If tests fail, Playwright generates a report. Run `npx playwright show-report` to view traces, screenshots, and error logs. Visual regression diffs are also shown here.

## Adding New Test Cases

### 1. New Utility or Hook
Create a file under `tests/unit/` (e.g., `myUtility.test.ts`).
Use `describe` and `it` blocks to cover all logic branches.
```ts
import { describe, it, expect } from 'vitest';
import { myUtility } from '../../src/utils/myUtility';

describe('myUtility', () => {
  it('should behave as expected', () => {
    expect(myUtility(true)).toBe(true);
  });
});
```

### 2. New Component
Create a file under `tests/unit/components/` (e.g., `MyComponent.test.tsx`).
Use `@testing-library/react` to render and interact with the component.
```tsx
import { render, screen } from '@testing-library/react';
import MyComponent from '../../src/components/MyComponent';

it('renders correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### 3. New E2E or Feature Workflow
Add a test in `tests/e2e/`. Use Playwright's `page` object to navigate and assert state.
If adding a visual test, use `expect(page).toHaveScreenshot()`. Playwright will automatically generate the baseline image on the first run.
```ts
test('new feature workflow', async ({ page }) => {
  await page.goto('/new-feature');
  await page.click('button#submit');
  await expect(page.locator('.success')).toBeVisible();
});
```

## Continuous Integration (CI)
All tests run automatically on every Push and Pull Request to the `main` branch via GitHub Actions (`.github/workflows/test.yml`).
The pipeline enforces:
- 80% coverage on Unit/Integration layers.
- Zero high/critical accessibility violations.
- All Playwright scenarios pass across Chromium, Firefox, and WebKit.
- Any failure blocks the merge.

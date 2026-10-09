# Repository Guidelines

## Project Structure & Module Organization

This repository is a Playwright end-to-end test suite; it contains no application source code. `playwright.config.ts` defines the test directory, browser projects, and run artifacts. Tests live in `tests/`, where separate `.spec.ts` files cover the Playwright example site, SauceDemo login and checkout behavior, and a BlazeDemo flight search. `.github/workflows/playwright.yml` runs the suite in GitHub Actions and uploads the HTML report.

## Build, Test, and Development Commands

The root `package.json` defines no npm scripts. Use the Playwright CLI directly:

- `npm ci` installs the locked dependencies.
- `npx playwright install` installs browsers locally; CI uses `npx playwright install --with-deps`.
- `npx playwright test` runs all tests in the configured Chromium, Firefox, and WebKit projects.
- `npx playwright test tests/Travelagency.spec.ts` runs one test file; add `--project=chromium` to limit it to Chromium.

The configured HTML reporter writes its report to `playwright-report/`; test output is written to `test-results/`.

## Coding Style & Naming Conventions

Tests are TypeScript files named with the `.spec.ts` suffix and use Playwright's `test` and `expect` APIs. Keep scenarios grouped by site or user journey in the existing spec files. Reuse small typed helper functions when setup steps are repeated. No linter, formatter, or TypeScript type-check command is defined in the root package configuration.

## Testing Guidelines

The test directory is configured as `./tests`, with tests running in parallel by default. The browser projects are Chromium, Firefox, and WebKit. Local runs are headed; CI sets retries to two and uses one worker. Specs assert titles, URLs, visibility, counts, and text using Playwright assertions, and use both role-based locators and site-specific selectors. CI installs dependencies and browsers, then executes `npx playwright test` on pushes and pull requests targeting `main` or `master`.

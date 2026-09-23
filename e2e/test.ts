import { test as base } from '@playwright/test';

export { expect, type Page, type Locator } from '@playwright/test';

// Exercise the real inline dataLayer and consent integration without depending
// on Google's network or sending synthetic visits to production analytics.
// Application/API requests remain real and their failures remain visible.
export const test = base.extend<{ isolatedAnalytics: void }>({
  isolatedAnalytics: [async ({ context }, use) => {
    await context.route('https://www.googletagmanager.com/gtag/js?*', route =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* isolated analytics fixture */' })
    );
    await use();
  }, { auto: true }],
});

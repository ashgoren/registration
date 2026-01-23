import type { Page } from '@playwright/test';

export const interceptAction = async (page: Page, action: string, error: { code: string; message: string }) => {
  const calledActions: string[] = [];

  await page.route('**/firebaseFunctionDispatcher', async (route, request) => {
    const body = JSON.parse(request.postData() || '{}');
    const calledAction = body.data?.action;
    calledActions.push(calledAction);
    
    if (calledAction === action) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            message: error.message,
            status: error.code.toUpperCase(),
          }
        })
      });
    } else {
      await route.continue();
    }
  });
  return calledActions;
};
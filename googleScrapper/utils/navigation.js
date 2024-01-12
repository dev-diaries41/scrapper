async function autoScroll(page, containerSelector) {
    await page.evaluate(async (selector) => {
      await new Promise((resolve) => {
        const container = document.querySelector(selector);
        if (!container) {
          console.error(`Scrollable container with selector ${selector} not found.`);
          resolve();
          return;
        }
  
        let lastResultsCount = -1;
        let totalHeight = 0;
        let distance = 100;
        let maxScrollAttempts = 100; // Adjust this value based on your needs
        let scrollAttempts = 0;
  
        const timer = setInterval(() => {
          const scrollHeight = container.scrollHeight;
          container.scrollBy(0, distance);
          totalHeight += distance;
          scrollAttempts++;
  
          // Check if the number of results has stabilized
          const currentResultsCount = container.querySelectorAll('.Nv2PK.tH5CWc.THOPZb').length;
          if (currentResultsCount === lastResultsCount) {
            if (totalHeight >= scrollHeight || scrollAttempts >= maxScrollAttempts) {
              clearInterval(timer);
              resolve();
            }
          } else {
            // Reset the counter if new results are detected
            lastResultsCount = currentResultsCount;
            totalHeight = 0;
            scrollAttempts = 0;
          }
        }, 100);
      });
    }, containerSelector);
  }

  async function clickButton(page, selector) {
    await page.waitForSelector(selector, { waitUntil: 'domcontentloaded' });
    await page.click(selector);
  }

  // Click the "Reject All" button for the cookie consent
async function handleCookieConsent(page) {
  const rejectAllSelector = "#yDmH0d > c-wiz > div > div > div > div.NIoIEf > div.G4njw > div.AIC7ge > div.CxJub > div.VtwTSb > form:nth-child(2) > div > div > button > div.VfPpkd-RLmnJb";
  await clickButton(page, rejectAllSelector);
}

  export {autoScroll, clickButton, handleCookieConsent};

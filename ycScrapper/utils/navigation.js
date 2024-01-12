async function autoScroll(page, companySelector) {
  await page.evaluate(async () => {
      await new Promise((resolve) => {
          let lastResultsCount = -1;
          let totalHeight = 0;
          let distance = 500;
          let maxScrollAttempts = 100; // Adjust this value based on your needs
          let scrollAttempts = 0;

          const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;
              scrollAttempts++;

              // Check if the number of results has stabilized
              const currentResultsCount = document.querySelectorAll('a[class="_company_lx3q7_339"]').length;
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
  });
}


  async function clickButton(page, selector) {
    await page.waitForSelector(selector, { waitUntil: 'domcontentloaded' });
    await page.click(selector);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async function selectOption(page, selector, optionValue){
    await page.waitForSelector(selector, { waitUntil: 'domcontentloaded' });
    await page.select(selector, optionValue);
    await new Promise((resolve) => setTimeout(resolve, 1000));

  }





  export {autoScroll, clickButton, selectOption};

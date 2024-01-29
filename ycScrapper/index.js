import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { autoScroll, selectOption } from './utils/navigation.js';
import { getCompanies} from './utils/getCompanies.js';


// Use Stealth plugin
puppeteer.use(StealthPlugin());
const ycUrl = `https://www.ycombinator.com/companies?batch=W24`;


//New version accepts postcode prefix
async function scrapeYCCompanies(industry = null) {

    let startTime, endTime;
    let browser;
    const sortBySelector = 'select[class="w-full rounded-md border-gray-300 pl-3 pr-10 pr-6 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"]'
    const optionValue = 'YCCompany_By_Launch_Date_production';

    try {
    // Record start time
    startTime = performance.now();

    browser = await puppeteer.launch({ 
        headless: false,
        // executablePath: '',      // set executable path and data directory in order to bypass linkedin login requirement
        // userDataDir: ''
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    await page.goto(ycUrl);
    await page.waitForNavigation();
    await selectOption(page,sortBySelector, optionValue );
    await autoScroll(page);

    const companies = await getCompanies(page, browser)
    
    // Record end time
    endTime = performance.now();
    const completeMessage = `Scrape Completed in ${(endTime - startTime).toFixed(3)} ms.`;
    
    console.log(completeMessage);

    return companies;

    } catch (error) {
    const failedMessage = `Scrape Failed: ${error.message}`;
    console.error('Error in scrapeYCCompanies', failedMessage);

} finally {
    if (browser) {
        await browser.close();
        }
    }
}

// Example usage
scrapeYCCompanies().then(results => {
    console.log(results)
    // const companiesFounders = results.map(company => company.founders)
    // console.log(companiesFounders);
});



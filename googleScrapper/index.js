import pLimit from 'p-limit';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { genGoogleMapsUrl } from './utils/getGoogleMapsUrlPrefix.js';
import { getCompanyDataLinks, getCompanyInfo } from './utils/getCompany.js';
import { handleCookieConsent } from './utils/navigation.js';
import metrics from './metrics/metrics.js';


// Use Stealth plugin
puppeteer.use(StealthPlugin());



//New version accepts postcode prefix
async function scrapeCompaniesByPostcode(postcodePrefix, q = "companies") {
    let startTime, endTime;
    let browser;

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
        const googleMapsUrl = await genGoogleMapsUrl(postcodePrefix, q, puppeteer);

        await page.goto(googleMapsUrl);
        await handleCookieConsent(page);

        const companiesInfo = await scrapeResults(page, postcodePrefix, browser);

        // Record end time
        endTime = performance.now();
        const insights =  metrics.getMetrics(companiesInfo)
        const completeMessage = `Scrape Completed in ${(endTime - startTime).toFixed(3)} ms: Found ${companiesInfo?.length || 0} companies near ${postcode}. See a summary of the key takeaways below.`;
    
        console.log(completeMessage);

        return {success: true, data:{companiesInfo, insights, resultsMessage: completeMessage}};

        } catch (error) {
        console.error('Error in scrapeCompaniesByPostcode', error);
        const failedMessage = `Scrape Failed: ${error.message}`;
        return {success: false, data: {companiesInfo: null, insights: null, resultsMessage: failedMessage}};
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}





async function scrapeResults(page, postcodePrefix, browser) {
    try {
        const links = await getCompanyDataLinks(page);
         // Process links in parallel with p-limit
         const limit = pLimit(5); 
         const companiesInfo = await Promise.all(
            links.map(link => limit(() => getCompanyInfo(link, browser)))
        );

        // Add queryPostcode to each result
        const companiesInfoWithPostcode = companiesInfo.map(info => ({ ...info, queryPostcode: postcodePrefix }));

        return companiesInfoWithPostcode;

    } catch (error) {
        console.error('Error while scraping results:', error);
        throw error; // Propagate the error for better error handling in the calling code
    }
}
  
  

// Example usage
const postcode = 'E15';
scrapeCompaniesByPostcode(postcode, 'ai companies').then(results => {
    console.log(results.data.companiesInfo);
});



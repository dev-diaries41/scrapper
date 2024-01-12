import pLimit from 'p-limit';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { clickButton } from '../googleScrapper/utils/navigation.js';
import { extractEmployees } from './utils/getCompanyInfo.js';

// Use Stealth plugin
puppeteer.use(StealthPlugin());

async function run(companies){
    let browser
    const results = []
    try{
        browser = await puppeteer.launch({ headless: false });
        for(const company of companies){
            const data = await scrapeLinkedIn(company.name, browser)
            results.push(data);
        }
        return results;
    }catch(error){
        console.error("Error in run: ", error.message);
    }finally{
        if(browser){
            await browser.close();
     }
    }
}


async function scrapeLinkedIn(companyName, browser){
    let page;
    try{
        page = await browser.newPage();    
        const formattedCompanyName = companyName.trim().replace(/[^\w\s]/g, "").replace(/\s+/g, "-").toLowerCase();
        const commonDDElement = 'dd.font-sans.text-md.text-color-text.break-words.overflow-hidden';
        const companySizeDiv = 'div[data-test-id="about-us__size"]';
        const companyTypeDiv = 'div[data-test-id="about-us__organizationType"]';
        const companyFoundedDiv = 'div[data-test-id="about-us__foundedOn"]';
        
        const companySizeSelector = `${companySizeDiv} ${commonDDElement}`;
        const companyTypeSelector = `${companyTypeDiv} ${commonDDElement}`;
        const companyFoundedSelector = `${companyFoundedDiv} ${commonDDElement}`;
        const sectionSelector = 'section[data-test-id="employees-at"]';
        const invalidPageSelector = '#ember27';
        




        const url = `https://www.linkedin.com/company/${formattedCompanyName}`
        // await clickButton(page, )
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const invalidPage = await page.$(invalidPageSelector);
        const isLoginPage = await page.$('input#password');
        
        if (invalidPage) {
            console.warn(`The page for ${companyName} is invalid page. Skipping.`);
            return null; // Return null or a specific value to indicate the page is a login page
        }

        if (isLoginPage) {
            console.warn(`The page for ${companyName} is a login page. Skipping.`);
            return null; // Return null or a specific value to indicate the page is a login page
        }
        
        const companySizeHandle = await page.waitForSelector(companySizeSelector, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(error => null);
        const companyTypeHandle = await page.waitForSelector(companyTypeSelector, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(error => null);
        const companyFoundedHandle = await page.waitForSelector(companyFoundedSelector, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(error => null);

          
        const data = {
        companySize: companySizeHandle ? await companySizeHandle.evaluate(node => node.innerText.trim()) : null,
        companyType: companyTypeHandle ? await companyTypeHandle.evaluate(node => node.innerText.trim()) : null,
        companyFounded: companyFoundedHandle ? await companyFoundedHandle.evaluate(node => node.innerText.trim()) : null,
        companyMainEmployees: await extractEmployees(page, sectionSelector)
        };
        
        return data;

    }catch(error){
        console.error("Error in scrapeLinkedIn: ", error.message);
        return null; // or handle the error appropriately

    }finally{
        if(page){
            await page.close();
        }

    }
    

}

// const companies = [{name: "marsh labels limited", size: 10}, {name: "marsh label technologies", size: 10},]
// run(companies)
// .then(results => console.log(results))
// .catch(err => console.error(err));
  
export {scrapeLinkedIn};
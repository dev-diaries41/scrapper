import { autoScroll } from './navigation.js';
import { extractEmail } from './extractEmail.js';
import { scrapeLinkedIn } from '../../linkedInScrapper/index.js';

const validInfoKeys = ['address', 'phone', 'located in', 'plus code'];
const sec = 1000;    // 1 second in milliseconds
const min = 60 * sec;


async function getCompanyDataLinks(page) {
    try {
        const results = new Set();
        const resultsSelector = "#QA0Szd > div > div > div.w6VYqd > div.bJzME.tTVLSc > div > div.e07Vkf.kA9KIf > div > div > div.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd > div.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd";
        const allResultsSelector = "#QA0Szd > div > div > div.w6VYqd > div.bJzME.tTVLSc > div > div.e07Vkf.kA9KIf > div > div > div.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd > div.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd.QjC7t";
        const resultClassSelector = '.Nv2PK.tH5CWc.THOPZb';
        const linkSelector = '.Nv2PK.tH5CWc.THOPZb a.hfpxzc';

        //Wait for the initial Results container to appear
        await page.waitForSelector(resultsSelector, { visible: true, waitUntil: 'domcontentloaded', timeout: 5 * min });

        //Scroll to the bottom of the results
        await autoScroll(page, resultsSelector);
        
        //Confirm/ Wait for, the appearance of the updated results container now showing all results
        const resultContainerHandle = await page.waitForSelector(allResultsSelector, { visible: true, waitUntil: 'domcontentloaded', timeout: 3 * min });
        const resultHandles = await resultContainerHandle.$$(resultClassSelector);

        //Extract link with company data from each result of results
        const resultDataPromises = resultHandles.map(async (resultHandle) => {
            const data = {};
            const linkHandle = await resultHandle.$(linkSelector);
            data.link = linkHandle ? await (await linkHandle.getProperty('href')).jsonValue() : '';

            if (data.link.trim() !== '') {
                results.add(data.link);
            }
        });

        await Promise.all(resultDataPromises);

        return Array.from(results);
    } catch (error) {
        console.error('Error in getMoreResults:', error);
    }
}

async function getCompanyInfo(link, browser) {
    const companyPage = await browser.newPage();
    await companyPage.setViewport({ width: 800, height: 600 });
    await companyPage.setDefaultNavigationTimeout(5 * min); // Set a timeout of 5 minutes
    const infoClassSelector = '.RcCsl.fVHpi.w4vB1d.NOE9ve.M0S7ae.AG25L';

    try {
      await companyPage.goto(link, { waitUntil: 'domcontentloaded' });
      const infoHandles = await companyPage.$$(infoClassSelector);
      
      //Get company name and category
      const companyName = await extractCompanyName(companyPage);
      const categoryName = await extractCompanyCategory(companyPage);
      const data1 = {name: companyName, category: categoryName};

      //Get review data
      const numberStars = await extractNumberStars(companyPage);
      const numberReviews = await extractNumberReviews(companyPage);
      const reviewData = {stars: numberStars, numReviews: numberReviews}

      //Get company address, phone, website and any more info
      const data2 = await extractInfoFromMainContainer(infoHandles);
      const email = await extractEmail(data2.website, browser);
      data2.email = email;
    //   const linkedinData = await scrapeLinkedIn(companyName, browser);
      const finalData = {...data1, ...data2, ...reviewData};

  
      // You can add additional processing or store the data as needed
      return finalData;
    } catch (error) {
      console.error(`Error fetching data for ${link}:`, error);
    } finally {
        if (companyPage && !companyPage.isClosed()) {
            await companyPage.close();
        }    
    }
  }

  async function extractInfoFromMainContainer(infoHandles) {
    const data = {};

    for (const infoHandle of infoHandles) {
        const buttonHandle = await infoHandle.$('button.CsEnBe');
        const websiteHandle = await infoHandle.$('a.CsEnBe');

        if (buttonHandle) {
            const ariaLabel = await buttonHandle.evaluate(node => node.getAttribute('aria-label'));

            if (ariaLabel) {
                const [property, value] = ariaLabel.split(':').map(item => item.trim());
                if(validInfoKeys.some(key => property.toLowerCase().startsWith(key))){
                    data[property.toLowerCase()] = value;
                    extractCityAndPostcode(property, value, data);
                }
            }
        }

        if (websiteHandle) {
            await extractCompanyWebsite(websiteHandle, data);
        }
    }

    return data;
}

async function extractCompanyWebsite(websiteHandle, data) {
    try {
        const website = await websiteHandle.evaluate(node => node.getAttribute('href'));
        const url = new URL(website);
        const baseUrl = `${url.protocol}//${url.host}`;

        if (!website.startsWith('https://business.google.com/create?')) {
            data['website'] = baseUrl;
        }
    } catch (error) {
        console.error("Error in extractCompanyWebsite: ", error.message);
    }
}


function extractCityAndPostcode(property, value, data) {
    if (property.toLowerCase() === "address") {
        const cityAndPostcode = value.split(',').pop().trim();
        // Split the string into an array of addressComponents
        const addressComponents = cityAndPostcode.split(' ');

        // The last two elements should be the postcode
        const postcode = addressComponents.slice(-2).join(' ');

        // The remaining addressComponents are part of the city
        const city = addressComponents.slice(0, -2).join(' ');
        data["city"] = city;
        data["postcode"] = postcode;

    }
       
    }



    async function extractCompanyName(companyPage) {
        try {
            const nameSelector = '#QA0Szd > div > div > div.w6VYqd > div.bJzME.tTVLSc > div > div.e07Vkf.kA9KIf > div > div > div.TIHn2 > div > div.lMbq3e > div:nth-child(1) > h1';
    
            const companyNameHandle = await companyPage.$(nameSelector);
    
            if (companyNameHandle) {
                return await companyNameHandle.evaluate(node => node.innerText.trim());
            }
    
            return null;
        } catch (error) {
            console.error("Error in extractCompanyName: ", error.message);
            return null;
        }
    }
    

    async function extractCompanyCategory(companyPage) {
        try {
            const categorySelector = '#QA0Szd > div > div > div.w6VYqd > div.bJzME.tTVLSc > div > div.e07Vkf.kA9KIf > div > div > div.TIHn2 > div > div.lMbq3e > div.LBgpqf > div > div:nth-child(2) > span > span > button';
    
            const categoryHandle = await companyPage.$(categorySelector);
    
            if (categoryHandle) {
                return await categoryHandle.evaluate(node => node.innerText.trim());
            }
    
            return null;
        } catch (error) {
            console.error("Error in extractCompanyCategory: ", error.message);
            return null;
        }
    }
    

    async function extractNumberStars(companyPage) {
        try {
            const starsSelector = '#QA0Szd > div > div > div.w6VYqd > div.bJzME.tTVLSc > div > div.e07Vkf.kA9KIf > div > div > div.TIHn2 > div > div.lMbq3e > div.LBgpqf > div > div.fontBodyMedium.dmRWX > div.F7nice > span:nth-child(1) > span.ceNzKf';
    
            const starsHandle = await companyPage.$(starsSelector);
    
            if (starsHandle) {
                return await starsHandle.evaluate(node => node.getAttribute('aria-label'));
            }
    
            return null;
        } catch (error) {
            console.error("Error in extractNumberStars: ", error.message);
            return null;
        }
    }
    

    async function extractNumberReviews(companyPage) {
        try {
            const reviewsSelector = '#QA0Szd > div > div > div.w6VYqd > div.bJzME.tTVLSc > div > div.e07Vkf.kA9KIf > div > div > div.TIHn2 > div > div.lMbq3e > div.LBgpqf > div > div.fontBodyMedium.dmRWX > div.F7nice > span:nth-child(2) > span > span';
    
            const reviewsHandle = await companyPage.$(reviewsSelector);
    
            if (reviewsHandle) {
                return await reviewsHandle.evaluate(node => node.getAttribute('aria-label'));
            }
    
            return null;
        } catch (error) {
            console.error("Error in extractNumberReviews: ", error.message);
            return null;
        }
    }
    




export  {getCompanyDataLinks, getCompanyInfo};
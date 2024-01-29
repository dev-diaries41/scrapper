import pLimit from 'p-limit';

const sec = 1000;    // 1 second in milliseconds
const min = 60 * sec;

// Updated selectors on 29th Jan - previous selectors stopped working
// If the extractCompanies function is not working as expected 
// it is likely due to YC updating there website
async function extractCompanies(page) {
    try {
        const baseUrl = 'https://www.ycombinator.com';
        const companyInfoSelector = 'a[class="_company_h0r20_339"]';
        const companyNameSelector = 'span[class="_coName_h0r20_454"]';
        const companyLocationSelector = 'span[class="_coLocation_h0r20_470"]';
        const companyDescriptionSelector = 'span[class="_coDescription_h0r20_479"]';
        const tagsSelector = 'a[class="_tagLink_h0r20_1020"]';

        const companyDataList = await page.evaluate(({ baseUrl, companyInfoSelector, companyNameSelector, companyLocationSelector, companyDescriptionSelector, tagsSelector }) => {
            const companyElements = document.querySelectorAll(companyInfoSelector);

            return Array.from(companyElements).map(companyElement => {
                const getInnerText = (selector) => {
                    const element = companyElement.querySelector(selector);
                    return element ? element.innerText : null;
                };

            const data = {
                extraInfoUrl: baseUrl + companyElement.getAttribute('href'),
                logoUrl: companyElement.querySelector('img')?.getAttribute('src') || null,
                companyName: getInnerText(companyNameSelector),
                companyLocation: getInnerText(companyLocationSelector),
                companyDescription: getInnerText(companyDescriptionSelector),
                industryTags: Array.from(companyElement.querySelectorAll(tagsSelector))
                    .map(tagElement => tagElement.innerText),
            };

                const finalData = { ...data, batch: data.industryTags[0], industryTags: data.industryTags.slice(1) };
                return finalData;
            });
        }, { baseUrl, companyInfoSelector, companyNameSelector, companyLocationSelector, companyDescriptionSelector, tagsSelector });
        return companyDataList;

    } catch (error) {
        console.error('Error in extractCompanies: ', error.message);
    }
}

async function extractExtraTags(page, companyInfoSelector, tagsSelector, location) {
    try {
        await page.waitForSelector(companyInfoSelector, {waitUntil: 'domcontentloaded', timeout: min });
        const companyElement = await page.$(companyInfoSelector);

        const extraIndustryTags = await page.evaluate((companyElement, tagsSelector) => {
            return Array.from(companyElement.querySelectorAll(tagsSelector))
                .map(tagElement => tagElement.innerText);
        }, companyElement, tagsSelector);

        const status = extraIndustryTags[0];
        const tags = extraIndustryTags
        .filter(tag => tag.toLowerCase() !== location.split(',')[0].trim().toLowerCase())
        .slice(1);
        return {status, tags};

    } catch (error) {
        console.error('Error in extractExtraTags: ', error.message);
    }
}

async function extractWebsite(page, websiteSelector) {
    try {
        await page.waitForSelector(websiteSelector, {waitUntil: 'domcontentloaded', timeout: min });
        const websiteElement = await page.$(websiteSelector);
        const website = await websiteElement?.evaluate(link => link.getAttribute('href')) || null;
        return website;

    } catch (error) {
        console.error('Error in extractWebsite: ', error.message);
    }
}



async function extractFounderInfo(page) {
    try {
        const extraCompanyData = await page.evaluate(({founderInfoSelector, founderNameSelector, founderDescriptionSelector, linkedInSelector}) => {
            const founderDataList = Array.from(document.querySelectorAll(founderInfoSelector)).map(founderElement => ({
                founderName: founderElement.querySelector(founderNameSelector)?.innerText || null,
                founderDescription: founderElement.querySelector(founderDescriptionSelector)?.innerText || null,
                founderImgUrl: founderElement.querySelector('img')?.getAttribute('src') || null,
                linkedinProfile: founderElement.querySelector(linkedInSelector)?.getAttribute('href') || null,
            }));

            return founderDataList;
        }, {founderInfoSelector: 'div[class="flex flex-row flex-col items-start gap-3 md:flex-row"]', founderNameSelector: 'h3[class="text-lg font-bold"]', founderDescriptionSelector: 'p[class="prose max-w-full whitespace-pre-line"]', linkedInSelector: 'a[class="inline-block h-5 w-5 bg-contain bg-image-linkedin"]'});

        return extraCompanyData;

    } catch (error) {
        console.error('Error in extractFounderInfo: ', error.message);
    }
}


// This function is responsible for getting the website, founders, status, and additional industry tags
async function extractExtraInfo(browser, company){
    let extraInfoPage;
    const updatedCompany = {...company};
    const companyInfoSelector = 'div[class="align-center flex flex-row flex-wrap gap-x-2 gap-y-2"]';
    const tagsSelector = 'div[class="yc-tw-Pill rounded-sm bg-[#E6E4DC] uppercase tracking-widest px-3 py-[3px] text-[12px] font-thin"]';
    const websiteSelector = 'a[class="mb-2 whitespace-nowrap md:mb-0"]';

    try{
        extraInfoPage = await browser.newPage();
        await extraInfoPage.setViewport({ width: 800, height: 600 });
        await extraInfoPage.goto(company.extraInfoUrl);
        updatedCompany.website = await extractWebsite(extraInfoPage, websiteSelector);
        updatedCompany.founders = await extractFounderInfo(extraInfoPage);
        const {tags, status} = await extractExtraTags(extraInfoPage, companyInfoSelector, tagsSelector, company.companyLocation);
        updatedCompany.industryTags = Array.from(new Set([...company.industryTags, ...tags]));
        updatedCompany.status = status || null;
        return updatedCompany;

    }catch(error){
        console.error('Error in extractExtraInfo: ', error.message);
        return company;
    }finally{
        if(extraInfoPage){
            await extraInfoPage.close();
        }
    }
}

async function getCompanies(page, browser) {
    const limit = pLimit(5)

    try {
        const companies = await extractCompanies(page);
        const updatedCompanies = await Promise.all(
            companies.map(company => limit(() => extractExtraInfo(browser, company)))
        );        
        return updatedCompanies;

    } catch (error) {
        console.error('Error in getCompanies: ', error.message);
    }
}

export { getCompanies };

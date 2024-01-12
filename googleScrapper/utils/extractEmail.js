const sec = 1000;    // 1 second in milliseconds
const min = 60 * sec;

async function extractEmail(companyWebsite, browser) {
    const checkAboutUs = `${companyWebsite}/about-us`;
    const checkContactUs = `${companyWebsite}/contact-us`;
    const checkAbout = `${companyWebsite}/about`;
    const checkContact = `${companyWebsite}/contact`;
    const checkContactHtml = `${companyWebsite}/contact.html`;
    const checkAboutHtml = `${companyWebsite}/about.html`;
    let email = '';

    try {

        // Check the 'home' page for the email
        email = await checkPageForEmail(companyWebsite, browser);
        if(email){
            return email;
        }

        // Check the 'about us' page for the email
        email = await checkPageForEmail(checkAboutUs, browser);
        if(email){
            return email;
        }

        // Check the 'contact us' page for the email
        email = await checkPageForEmail(checkContactUs, browser);
        if(email){
            return email;
        }

        // Check the 'about' page for the email
        email = await checkPageForEmail(checkAbout, browser);
        if(email){
            return email;
        }

        // Check the 'contact' page for the email
        email = await checkPageForEmail(checkContact, browser);
        if(email){
            return email;
        }

        // Check the 'contact.html ' page for the email
        email = await checkPageForEmail(checkContactHtml, browser);
        if(email){
            return email;
        }

        // Check the 'about.html' page for the email
        email = await checkPageForEmail(checkAboutHtml, browser);
        if(email){
            return email;
        }
    
        return email;


    } catch (error) {
        console.error("Error in extractEmail: ", error.message);
    }

}


// Helper function for page navigation and email extraction
async function checkPageForEmail(url, browser) {
    let emailPage;
    try {
        emailPage = await browser.newPage();
        await emailPage.setDefaultNavigationTimeout(2 * min); // Set a timeout of 60 seconds
        await emailPage.setViewport({ width: 800, height: 600 });
        await emailPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 3 * min });
        const pageEmail = await getEmailFromPage(emailPage);
        return pageEmail;

    } catch (error) {
        if(error.message.includes('ERR_NAME_NOT_RESOLVED')){
            console.warn(`The URL:${url}, does not exist or email not found on page`);
        }else{
            console.error("Error in checkPageForEmail: ", error.message);
        }
    } finally {
        if (emailPage) {
            await emailPage.close();
        }
    }
}

async function getEmailFromPage(page) {
    try {
        const email = await page.evaluate(() => {
            // Use a more specific selector for email elements if possible
            const emailElements = document.querySelectorAll('a[href^="mailto:"]');
            const emails = Array.from(emailElements).map(element => element.href.replace('mailto:', ''));

            // If no email elements found, use a generic approach to find the email without a specific selector
            // Fall back to generic method if no email found
            if (emails.length === 0) {
                const emailRegex = /\b[A-Za-z._%+-][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
                const textContent = document.body.textContent;
                const matches = textContent.match(emailRegex);

                return matches ? matches[0] : '';
            }

            // Filter out emails that start with a number
            // Filter out emails that start with a number and do not match the expected format
            const validEmails = emails.filter(email => {
                const startsWithNumber = /^\d/.test(email);
                const isValidFormat = /\b[A-Za-z._%+-][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(email);
                return !startsWithNumber && isValidFormat;
            });

            // Return the first valid email found using the specific selector
            return validEmails.length > 0 ? validEmails[0].trim() : '';
        });

        // Check if email is defined before creating the formatEmail object
        if (email !== undefined) {
            const formatEmail = new URL("mailto:" + email);
            const baseEmail = formatEmail.protocol === 'mailto:' ? formatEmail.pathname : formatEmail.href;

            return baseEmail || '';
        } else {
            return '';
        }
    } catch (error) {
        console.error('Error in getEmailFromPage:', error.message);
        return '';
    }
}

export {extractEmail};
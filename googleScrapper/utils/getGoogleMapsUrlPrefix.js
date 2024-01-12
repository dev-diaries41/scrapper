import { handleCookieConsent } from "./navigation.js";
function genGoogleMapsUrlToFindCoords (postcodePrefix) {

    if (!postcodePrefix) {
      throw new Error('Invalid postcodePrefix');
    }

    const baseGoogleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(postcodePrefix)}/`;
    return baseGoogleMapsUrl;
  };



async function getCoords(postcodePrefix, puppeteer) {
    let findCoordsBrowser;
  
    try {
      findCoordsBrowser = await puppeteer.launch({ headless: false });
        const page = await findCoordsBrowser.newPage();
        await page.setViewport({ width: 800, height: 600 });
        const googleMapsUrl = genGoogleMapsUrlToFindCoords(postcodePrefix);
        await page.goto(googleMapsUrl);
        await handleCookieConsent(page);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        if(page.url().includes('@')){
            const match = page.url().match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (match) {
              const [_, lat, long] = match;
              return {lat, long};
            }
            
        }
        return null;

    } catch (error) {
        console.error('Error in getCoordsPostcodePrefix:', error.message);
        return null;
    } finally {
        if (findCoordsBrowser) {
            await findCoordsBrowser.close();
        }
    }
}
 
//Generate a google maps search url using only postcode prefix
async function genGoogleMapsUrl (postcodePrefix, query, puppeteer) {
  const coords = await getCoords(postcodePrefix, puppeteer)
  if (!coords) {
    throw new Error('Invalid coordinates');
  }

  const {lat, long} = coords;
  const zoomLevel = 15;     // zoom level of 15 is approximately a radius of 5km
  const baseGoogleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/`;
  const googleMapsUrl = `${baseGoogleMapsUrl}@${lat},${long},${zoomLevel}z`;
  return googleMapsUrl;
};

export {getCoords, genGoogleMapsUrl};

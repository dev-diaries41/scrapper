import axios from 'axios';
import { handleCookieConsent } from './navigation.js';

async function getCoords (postcode){
    try {
      const apiUrl = `https://api.postcodes.io/postcodes/${postcode}`;
      const res = await axios.get(apiUrl);
      const coords = { long: res.data.result.longitude, lat: res.data.result.latitude };
      return coords;
    } catch (error) {
      // Handle the error locally
      console.error('Error in getCoords:', error.message);
      return null; // or any default value or behavior
    }
  };

  async function genGoogleMapsUrl (postcode, query){
    const coords = await getCoords(postcode)
    
    if (!coords) {
      console.error('Invalid coordinates');
      return null;
    }
    
    const { lat, long } = coords;
    const zoomLevel = 15;     // zoom level of 15 is approximately a radius of 5km


    const baseGoogleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/`;
    const googleMapsUrl = `${baseGoogleMapsUrl}@${lat},${long},${zoomLevel}z`;
    return googleMapsUrl;
  };

  

   
  

export {getCoords, genGoogleMapsUrl};

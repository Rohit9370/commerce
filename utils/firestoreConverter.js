import { Timestamp } from 'firebase/firestore';

/**
 * Converts Firebase Timestamp objects to JavaScript Date objects
 * to make data serializable for Redux store
 */
export function convertTimestamps(data) {
  if (!data) return data;
  
  console.log('Converting data:', typeof data, Array.isArray(data));
  
  // Handle arrays
  if (Array.isArray(data)) {
    console.log('Converting array with', data.length, 'items');
    return data.map(item => convertTimestamps(item));
  }
  
  // Handle objects
  if (typeof data === 'object') {
    console.log('Converting object with keys:', Object.keys(data));
    const converted = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Timestamp) {
        console.log('Converting timestamp for key:', key);
        converted[key] = value.toDate();
      } else {
        converted[key] = convertTimestamps(value);
      }
    }
    return converted;
  }
  
  // Return primitive values as-is
  console.log('Returning primitive value:', data);
  return data;
}
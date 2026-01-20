import { Timestamp } from 'firebase/firestore';

/**
 * Converts Firebase Timestamp objects to ISO strings
 * to make data serializable for Redux store
 */
export function convertTimestamps(data) {
  if (!data) return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => convertTimestamps(item));
  }
  
  // Handle Date objects (convert to ISO string)
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  // Handle Firebase Timestamps
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  
  // Handle objects
  if (typeof data === 'object' && data !== null) {
    const converted = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertTimestamps(value);
    }
    return converted;
  }
  
  // Return primitive values as-is
  return data;
}

/**
 * Converts ISO date strings back to Date objects when needed
 */
export function parseTimestamps(data, timestampFields = ['createdAt', 'updatedAt', 'bookingDate']) {
  if (!data) return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => parseTimestamps(item, timestampFields));
  }
  
  // Handle objects
  if (typeof data === 'object' && data !== null) {
    const parsed = { ...data };
    for (const field of timestampFields) {
      if (parsed[field] && typeof parsed[field] === 'string') {
        try {
          parsed[field] = new Date(parsed[field]);
        } catch (error) {
          console.warn(`Failed to parse timestamp field ${field}:`, error);
        }
      }
    }
    return parsed;
  }
  
  return data;
}
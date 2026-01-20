/**
 * Clear App Cache Script
 * 
 * This script helps clear cached authentication data that might be causing
 * the app to show user screens without proper login.
 * 
 * Run this if you're experiencing authentication issues.
 */

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function clearAppCache() {
  try {
    console.log('🧹 Clearing app cache...');
    
    // Clear all AsyncStorage data
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage cleared');
    
    // List of specific keys that might be cached
    const keysToRemove = [
      'user_auth_data',
      'onboarding_completed', 
      'session_expiry',
      'persist:root',
      'redux_persist_root'
    ];
    
    for (const key of keysToRemove) {
      try {
        await AsyncStorage.removeItem(key);
        console.log(`✅ Removed: ${key}`);
      } catch (error) {
        console.log(`⚠️  Could not remove ${key}:`, error.message);
      }
    }
    
    console.log('🎉 App cache cleared successfully!');
    console.log('📱 Please restart the app to see changes.');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

// Instructions for manual clearing
console.log('📋 Manual Cache Clearing Instructions:');
console.log('1. Close the app completely');
console.log('2. Clear app data/cache from device settings');
console.log('3. Or run: npx react-native start --reset-cache');
console.log('4. Restart the app');
console.log('');

// Run the function if this script is executed directly
if (require.main === module) {
  clearAppCache();
}

module.exports = { clearAppCache };
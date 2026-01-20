const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMWNelSOq6Zf2iqWmW8pc9EZRJIcRYyCw",
  authDomain: "serviceprovider-33f80.firebaseapp.com",
  projectId: "serviceprovider-33f80",
  storageBucket: "serviceprovider-33f80.firebasestorage.app",
  messagingSenderId: "735847697694",
  appId: "1:735847697694:web:f58a5f10a026375b1f8d0f",
  databaseURL: "https://serviceprovider-33f80-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Reviews Collection Structure
 * 
 * Each review document contains:
 * - reviewId: Auto-generated document ID
 * - bookingId: Reference to the booking
 * - userId: ID of the user who gave the review
 * - providerId: ID of the service provider
 * - rating: Number (1-5)
 * - comment: Text review
 * - serviceCategory: Category of service reviewed
 * - createdAt: Timestamp
 * - updatedAt: Timestamp
 * - isVerified: Boolean (to prevent fake reviews)
 */

// Sample reviews data structure
const sampleReviews = [
  {
    bookingId: "sample_booking_1",
    userId: "sample_user_1", 
    providerId: "sample_provider_1",
    userName: "Rahul Sharma",
    providerName: "Sharma Electronics",
    rating: 5,
    comment: "Excellent service! Fixed my electrical issue quickly and professionally.",
    serviceCategory: "Electrician",
    serviceName: "Home Electrical Repair",
    isVerified: true
  },
  {
    bookingId: "sample_booking_2",
    userId: "sample_user_2",
    providerId: "sample_provider_2", 
    userName: "Priya Patel",
    providerName: "Priya Beauty Salon",
    rating: 4,
    comment: "Good service, but could be faster. Overall satisfied with the haircut.",
    serviceCategory: "Salon",
    serviceName: "Hair Cut & Styling",
    isVerified: true
  }
];

// Function to create reviews collection structure
async function setupReviewsCollection() {
  try {
    console.log('⭐ Setting up Reviews collection structure...');
    
    // Add sample reviews to demonstrate structure
    for (const review of sampleReviews) {
      const reviewDoc = {
        ...review,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'reviews'), reviewDoc);
      console.log(`✅ Added sample review: ${review.userName} -> ${review.providerName} (${review.rating}⭐) - ID: ${docRef.id}`);
    }
    
    console.log('🎉 Reviews collection setup complete!');
    console.log('\n📋 Reviews Collection Structure:');
    console.log('- bookingId: Reference to booking');
    console.log('- userId: Customer who gave review');
    console.log('- providerId: Service provider being reviewed');
    console.log('- rating: 1-5 stars');
    console.log('- comment: Text review');
    console.log('- serviceCategory: Type of service');
    console.log('- isVerified: Prevents fake reviews');
    
  } catch (error) {
    console.error('❌ Error setting up reviews:', error);
  }
}

// Run the function
setupReviewsCollection();
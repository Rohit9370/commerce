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

// Service categories with common services
const serviceCategories = [
  {
    category: "Electrician",
    services: [
      { name: "Home Electrical Repair", basePrice: "₹200-500", duration: "1-2 hours" },
      { name: "Appliance Installation", basePrice: "₹300-800", duration: "1-3 hours" },
      { name: "Wiring & Circuit Repair", basePrice: "₹500-1500", duration: "2-4 hours" },
      { name: "Fan & Light Installation", basePrice: "₹150-400", duration: "30min-1hour" },
      { name: "Switch & Socket Repair", basePrice: "₹100-300", duration: "30min-1hour" }
    ]
  },
  {
    category: "Plumber",
    services: [
      { name: "Pipe Repair & Installation", basePrice: "₹300-800", duration: "1-3 hours" },
      { name: "Bathroom Fitting", basePrice: "₹1000-3000", duration: "3-6 hours" },
      { name: "Water Tank Cleaning", basePrice: "₹500-1000", duration: "2-3 hours" },
      { name: "Drain Cleaning", basePrice: "₹200-500", duration: "1-2 hours" },
      { name: "Tap & Faucet Repair", basePrice: "₹150-400", duration: "30min-1hour" }
    ]
  },
  {
    category: "Salon",
    services: [
      { name: "Hair Cut & Styling", basePrice: "₹300-800", duration: "45min-1hour" },
      { name: "Facial Treatment", basePrice: "₹500-1200", duration: "1-2 hours" },
      { name: "Bridal Makeup", basePrice: "₹2000-5000", duration: "2-4 hours" },
      { name: "Hair Coloring", basePrice: "₹800-2000", duration: "2-3 hours" },
      { name: "Manicure & Pedicure", basePrice: "₹400-800", duration: "1-1.5 hours" }
    ]
  },
  {
    category: "Tailor",
    services: [
      { name: "Shirt Stitching", basePrice: "₹400-600", duration: "3-5 days" },
      { name: "Pant Stitching", basePrice: "₹500-800", duration: "3-5 days" },
      { name: "Suit Stitching", basePrice: "₹1500-3000", duration: "7-10 days" },
      { name: "Alterations", basePrice: "₹100-300", duration: "1-2 days" },
      { name: "Dress Stitching", basePrice: "₹800-1500", duration: "5-7 days" }
    ]
  },
  {
    category: "Mechanic",
    services: [
      { name: "Car Service & Repair", basePrice: "₹800-2500", duration: "2-4 hours" },
      { name: "Bike Service & Repair", basePrice: "₹300-1000", duration: "1-2 hours" },
      { name: "Oil Change", basePrice: "₹200-600", duration: "30min-1hour" },
      { name: "Brake Repair", basePrice: "₹500-1500", duration: "1-3 hours" },
      { name: "Battery Replacement", basePrice: "₹1500-4000", duration: "30min-1hour" }
    ]
  }
];

// Add services to database
async function setupServicesCollection() {
  try {
    console.log('🛠️ Setting up Services collection...');
    
    for (const categoryData of serviceCategories) {
      for (const service of categoryData.services) {
        const serviceDoc = {
          name: service.name,
          category: categoryData.category,
          basePrice: service.basePrice,
          duration: service.duration,
          description: `Professional ${service.name.toLowerCase()} service`,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'services'), serviceDoc);
        console.log(`✅ Added: ${service.name} (${categoryData.category}) - ID: ${docRef.id}`);
      }
    }
    
    console.log('🎉 Services collection setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up services:', error);
  }
}

// Run the function
setupServicesCollection();
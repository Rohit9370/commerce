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

// Gadge Nagar shopkeepers data
const gadgeNagarShops = [
  {
    fullName: "Rajesh Kumar Sharma",
    email: "rajesh.sharma@gmail.com",
    phone: "+91 9876543210",
    role: "shopkeeper",
    shopName: "Sharma Electronics & Repair",
    category: "Electrician",
    shopPhone: "+91 9876543210",
    address: "Shop No. 15, Gadge Nagar Main Road, Near Bus Stop, Gadge Nagar, Nagpur - 440024",
    location: {
      latitude: "21.1458",
      longitude: "79.0882"
    },
    area: "Gadge Nagar",
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440024",
    services: [
      { name: "Home Electrical Repair", price: "₹200-500" },
      { name: "Appliance Installation", price: "₹300-800" },
      { name: "Wiring & Circuit Repair", price: "₹500-1500" },
      { name: "Fan & Light Installation", price: "₹150-400" }
    ],
    timing: {
      open: "9:00 AM",
      close: "8:00 PM"
    },
    offDays: ["Sunday"],
    experience: "8 years",
    rating: 4.5,
    totalBookings: 156,
    shopImages: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500"
    ],
    description: "Professional electrical services for homes and offices. Quick response and quality work guaranteed.",
    isVerified: true,
    verificationDate: new Date().toISOString()
  },
  {
    fullName: "Priya Devi Patel",
    email: "priya.patel@gmail.com",
    phone: "+91 9123456789",
    role: "shopkeeper",
    shopName: "Priya Beauty Salon & Spa",
    category: "Salon",
    shopPhone: "+91 9123456789",
    address: "First Floor, Gadge Nagar Shopping Complex, Gadge Nagar, Nagpur - 440024",
    location: {
      latitude: "21.1465",
      longitude: "79.0875"
    },
    area: "Gadge Nagar",
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440024",
    services: [
      { name: "Hair Cut & Styling", price: "₹300-800" },
      { name: "Facial Treatment", price: "₹500-1200" },
      { name: "Bridal Makeup", price: "₹2000-5000" },
      { name: "Hair Coloring", price: "₹800-2000" }
    ],
    timing: {
      open: "10:00 AM",
      close: "7:00 PM"
    },
    offDays: ["Monday"],
    experience: "12 years",
    rating: 4.8,
    totalBookings: 234,
    shopImages: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500"
    ],
    description: "Premium beauty services for women. Experienced beauticians and latest equipment.",
    isVerified: true,
    verificationDate: new Date().toISOString()
  },
  {
    fullName: "Mohammad Aslam Khan",
    email: "aslam.khan@gmail.com",
    phone: "+91 9988776655",
    role: "shopkeeper",
    shopName: "Khan Tailoring & Alterations",
    category: "Tailor",
    shopPhone: "+91 9988776655",
    address: "Shop No. 8, Gadge Nagar Market, Near Temple, Gadge Nagar, Nagpur - 440024",
    location: {
      latitude: "21.1452",
      longitude: "79.0888"
    },
    area: "Gadge Nagar",
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440024",
    services: [
      { name: "Shirt Stitching", price: "₹400-600" },
      { name: "Pant Stitching", price: "₹500-800" },
      { name: "Suit Stitching", price: "₹1500-3000" },
      { name: "Alterations", price: "₹100-300" }
    ],
    timing: {
      open: "8:00 AM",
      close: "9:00 PM"
    },
    offDays: ["Friday"],
    experience: "15 years",
    rating: 4.6,
    totalBookings: 189,
    shopImages: [
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=500"
    ],
    description: "Expert tailoring services for all types of clothing. Custom fitting and quick delivery.",
    isVerified: true,
    verificationDate: new Date().toISOString()
  },
  {
    fullName: "Suresh Babu Reddy",
    email: "suresh.reddy@gmail.com",
    phone: "+91 9445566778",
    role: "shopkeeper",
    shopName: "Reddy Plumbing Services",
    category: "Plumber",
    shopPhone: "+91 9445566778",
    address: "House No. 45, Gadge Nagar Colony, Behind School, Gadge Nagar, Nagpur - 440024",
    location: {
      latitude: "21.1470",
      longitude: "79.0870"
    },
    area: "Gadge Nagar",
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440024",
    services: [
      { name: "Pipe Repair & Installation", price: "₹300-800" },
      { name: "Bathroom Fitting", price: "₹1000-3000" },
      { name: "Water Tank Cleaning", price: "₹500-1000" },
      { name: "Drain Cleaning", price: "₹200-500" }
    ],
    timing: {
      open: "7:00 AM",
      close: "7:00 PM"
    },
    offDays: ["Sunday"],
    experience: "10 years",
    rating: 4.4,
    totalBookings: 167,
    shopImages: [
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500"
    ],
    description: "Reliable plumbing services for residential and commercial properties. 24/7 emergency service available.",
    isVerified: true,
    verificationDate: new Date().toISOString()
  },
  {
    fullName: "Amit Singh Chauhan",
    email: "amit.chauhan@gmail.com",
    phone: "+91 9334455667",
    role: "shopkeeper",
    shopName: "Chauhan Auto Garage",
    category: "Mechanic",
    shopPhone: "+91 9334455667",
    address: "Plot No. 12, Gadge Nagar Industrial Area, Near Petrol Pump, Gadge Nagar, Nagpur - 440024",
    location: {
      latitude: "21.1445",
      longitude: "79.0895"
    },
    area: "Gadge Nagar",
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440024",
    services: [
      { name: "Car Service & Repair", price: "₹800-2500" },
      { name: "Bike Service & Repair", price: "₹300-1000" },
      { name: "Oil Change", price: "₹200-600" },
      { name: "Brake Repair", price: "₹500-1500" }
    ],
    timing: {
      open: "8:00 AM",
      close: "8:00 PM"
    },
    offDays: ["Sunday"],
    experience: "12 years",
    rating: 4.7,
    totalBookings: 203,
    shopImages: [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500"
    ],
    description: "Complete automotive repair and maintenance services. Experienced mechanics and genuine parts.",
    isVerified: true,
    verificationDate: new Date().toISOString()
  }
];

// Add shopkeepers to database
async function addGadgeNagarShops() {
  try {
    console.log('🏪 Adding Gadge Nagar shopkeepers...');
    
    for (let i = 0; i < gadgeNagarShops.length; i++) {
      const shop = gadgeNagarShops[i];
      
      // Add timestamps
      shop.createdAt = serverTimestamp();
      shop.updatedAt = serverTimestamp();
      
      const docRef = await addDoc(collection(db, 'users'), shop);
      console.log(`✅ Added: ${shop.shopName} (ID: ${docRef.id})`);
    }
    
    console.log(`🎉 Successfully added ${gadgeNagarShops.length} Gadge Nagar shopkeepers!`);
    console.log('📱 Your application is ready to use!');
    
  } catch (error) {
    console.error('❌ Error adding shopkeepers:', error);
  }
}

// Run the function
addGadgeNagarShops();
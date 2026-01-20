import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    where
} from 'firebase/firestore';
import { db } from './firebase-node-config.js';

// Gadge Nagar shopkeeper data
const gadgeNagarShopkeepers = [
  {
    fullName: "Rajesh Kumar Sharma",
    email: "rajesh.sharma@gmail.com",
    phone: "+91 9876543210",
    role: "shopkeeper",
    shopName: "Sharma Electronics & Repair",
    category: "Electrician",
    shopPhone: "+91 9876543210",
    address: "Shop No. 15, Gadge Nagar Main Road, Near Bus Stop, Gadge Nagar, Nagpur - 440024",
    location: { latitude: "21.1458", longitude: "79.0882" },
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
    timing: { open: "9:00 AM", close: "8:00 PM" },
    offDays: ["Sunday"],
    experience: "8 years",
    rating: 4.5,
    totalBookings: 156,
    shopImages: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"
    ],
    description: "Professional electrical services for homes and offices. Quick response and quality work guaranteed.",
    isVerified: true,
    verificationDate: new Date().toISOString(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
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
    location: { latitude: "21.1465", longitude: "79.0875" },
    area: "Gadge Nagar",
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440024",
    services: [
      { name: "Hair Cut & Styling", price: "₹300-800" },
      { name: "Facial Treatment", price: "₹500-1200" },
      { name: "Bridal Makeup", price: "₹2000-5000" },
      { name: "Hair Coloring", price: "₹800-2000" },
      { name: "Manicure & Pedicure", price: "₹400-800" }
    ],
    timing: { open: "10:00 AM", close: "7:00 PM" },
    offDays: ["Monday"],
    experience: "12 years",
    rating: 4.8,
    totalBookings: 234,
    shopImages: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500"
    ],
    description: "Premium beauty services for women. Experienced beauticians and latest equipment.",
    isVerified: true,
    verificationDate: new Date().toISOString(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
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
    location: { latitude: "21.1452", longitude: "79.0888" },
    area: "Gadge Nagar",
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440024",
    services: [
      { name: "Shirt Stitching", price: "₹400-600" },
      { name: "Pant Stitching", price: "₹500-800" },
      { name: "Suit Stitching", price: "₹1500-3000" },
      { name: "Alterations", price: "₹100-300" },
      { name: "Blouse Stitching", price: "₹300-600" }
    ],
    timing: { open: "8:00 AM", close: "9:00 PM" },
    offDays: ["Friday"],
    experience: "15 years",
    rating: 4.6,
    totalBookings: 189,
    shopImages: [
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=500",
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500"
    ],
    description: "Expert tailoring services for all types of clothing. Custom fitting and quick delivery.",
    isVerified: true,
    verificationDate: new Date().toISOString(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
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
    location: { latitude: "21.1470", longitude: "79.0870" },
    area: "Gadge Nagar",
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440024",
    services: [
      { name: "Pipe Repair & Installation", price: "₹300-800" },
      { name: "Bathroom Fitting", price: "₹1000-3000" },
      { name: "Water Tank Cleaning", price: "₹500-1000" },
      { name: "Drain Cleaning", price: "₹200-500" },
      { name: "Tap & Faucet Repair", price: "₹150-400" }
    ],
    timing: { open: "7:00 AM", close: "7:00 PM" },
    offDays: ["Sunday"],
    experience: "10 years",
    rating: 4.4,
    totalBookings: 167,
    shopImages: [
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500",
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=500"
    ],
    description: "Reliable plumbing services for residential and commercial properties. 24/7 emergency service available.",
    isVerified: true,
    verificationDate: new Date().toISOString(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
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
    location: { latitude: "21.1445", longitude: "79.0895" },
    area: "Gadge Nagar",
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440024",
    services: [
      { name: "Car Service & Repair", price: "₹800-2500" },
      { name: "Bike Service & Repair", price: "₹300-1000" },
      { name: "Oil Change", price: "₹200-600" },
      { name: "Brake Repair", price: "₹500-1500" },
      { name: "Engine Diagnostics", price: "₹300-800" }
    ],
    timing: { open: "8:00 AM", close: "8:00 PM" },
    offDays: ["Sunday"],
    experience: "12 years",
    rating: 4.7,
    totalBookings: 203,
    shopImages: [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500",
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500"
    ],
    description: "Complete automotive repair and maintenance services. Experienced mechanics and genuine parts.",
    isVerified: true,
    verificationDate: new Date().toISOString(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    fullName: "Sunita Devi Gupta",
    email: "sunita.gupta@gmail.com",
    phone: "+91 9876512345",
    role: "shopkeeper",
    shopName: "Gupta Cleaning Services",
    category: "Cleaning",
    shopPhone: "+91 9876512345",
    address: "Office No. 3, Gadge Nagar Commercial Complex, Gadge Nagar, Nagpur - 440024",
    location: { latitude: "21.1460", longitude: "79.0885" },
    area: "Gadge Nagar",
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440024",
    services: [
      { name: "House Deep Cleaning", price: "₹1000-3000" },
      { name: "Office Cleaning", price: "₹800-2000" },
      { name: "Carpet Cleaning", price: "₹300-800" },
      { name: "Kitchen Cleaning", price: "₹500-1200" },
      { name: "Bathroom Cleaning", price: "₹300-600" }
    ],
    timing: { open: "6:00 AM", close: "6:00 PM" },
    offDays: ["Sunday"],
    experience: "6 years",
    rating: 4.3,
    totalBookings: 145,
    shopImages: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500",
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500"
    ],
    description: "Professional cleaning services for homes and offices. Eco-friendly products and trained staff.",
    isVerified: true,
    verificationDate: new Date().toISOString(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
];

// Delete existing shopkeeper data
async function deleteExistingShopkeepers() {
  try {
    console.log('🗑️ Deleting existing shopkeeper data...');
    
    const q = query(
      collection(db, 'users'), 
      where('role', 'in', ['shopkeeper', 'admin'])
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = [];
    
    querySnapshot.forEach((docSnapshot) => {
      deletePromises.push(deleteDoc(doc(db, 'users', docSnapshot.id)));
    });
    
    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${deletePromises.length} existing shopkeeper records`);
    
    return deletePromises.length;
  } catch (error) {
    console.error('❌ Error deleting existing data:', error);
    throw error;
  }
}

// Insert new shopkeeper data
async function insertShopkeeperData() {
  try {
    console.log('📝 Inserting new shopkeeper data for Gadge Nagar...');
    
    const insertPromises = gadgeNagarShopkeepers.map(async (shopkeeper) => {
      const docRef = await addDoc(collection(db, 'users'), shopkeeper);
      console.log(`✅ Added ${shopkeeper.shopName} with ID: ${docRef.id}`);
      return docRef;
    });
    
    const results = await Promise.all(insertPromises);
    console.log(`🎉 Successfully inserted ${results.length} shopkeeper records`);
    
    return results;
  } catch (error) {
    console.error('❌ Error inserting shopkeeper data:', error);
    throw error;
  }
}

// Verify inserted data
async function verifyInsertedData() {
  try {
    console.log('🔍 Verifying inserted data...');
    
    const q = query(
      collection(db, 'users'), 
      where('area', '==', 'Gadge Nagar')
    );
    
    const querySnapshot = await getDocs(q);
    const shopkeepers = [];
    
    querySnapshot.forEach((doc) => {
      shopkeepers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Found ${shopkeepers.length} shopkeepers in Gadge Nagar:`);
    shopkeepers.forEach((shop, index) => {
      console.log(`${index + 1}. ${shop.shopName} (${shop.category}) - ${shop.phone}`);
    });
    
    return shopkeepers;
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    throw error;
  }
}

// Main function
async function setupGadgeNagarData() {
  try {
    console.log('🚀 Starting Gadge Nagar Shopkeeper Data Setup...\n');
    
    // Step 1: Delete existing data
    const deletedCount = await deleteExistingShopkeepers();
    console.log('');
    
    // Step 2: Insert new data
    const insertedRefs = await insertShopkeeperData();
    console.log('');
    
    // Step 3: Verify inserted data
    const verifiedShopkeepers = await verifyInsertedData();
    console.log('');
    
    console.log('🎊 Gadge Nagar shopkeeper data setup completed successfully!');
    console.log(`📊 Summary: Deleted ${deletedCount}, Inserted ${insertedRefs.length}, Verified ${verifiedShopkeepers.length}`);
    
    return {
      deleted: deletedCount,
      inserted: insertedRefs.length,
      verified: verifiedShopkeepers.length,
      shopkeepers: verifiedShopkeepers
    };
    
  } catch (error) {
    console.error('💥 Error in Gadge Nagar data setup:', error);
    throw error;
  }
}

// Run the setup
setupGadgeNagarData()
  .then((result) => {
    console.log('\n✅ Setup completed successfully!');
    console.log('📱 You can now test the application with the new data.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
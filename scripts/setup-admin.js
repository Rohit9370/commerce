

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../app/services/firebaseconfig.js';

const setupAdminUser = async () => {
  try {
    console.log('Creating admin user...');
    
    // Create admin user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'admin@commerce.com', 
      'pass@123'
    );
    
    const user = userCredential.user;
    console.log('Admin user created with UID:', user.uid);
    
    // Add admin user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      role: 'super-admin',
      fullName: 'System Administrator',
      phone: '+1234567890',
      address: 'Admin Office',
      createdAt: new Date(),
      isActive: true,
      permissions: {
        manageUsers: true,
        manageShops: true,
        manageBookings: true,
        viewAnalytics: true,
        systemSettings: true
      }
    });
    
    console.log('✅ Admin user setup completed successfully!');
    console.log('📧 Email: admin@commerce.com');
    console.log('🔑 Password: pass@123');
    console.log('👤 Role: super-admin');
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Admin user already exists');
    }
  }
};

// Run the setup
setupAdminUser();
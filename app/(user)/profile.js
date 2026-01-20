import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth, signOut, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { useUserRole } from '../../hooks/useUserRole';
import { clearAuth } from '../../store/slices/authSlice';
import { clearAuthData } from '../../utils/authStorage';
import TypographyComponents from '../Components/TypographyComponents';
import { db } from '../services/firebaseconfig';

export default function UserProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { userData, userRole, loading: roleLoading } = useUserRole();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);

  // Authentication guard
  useEffect(() => {
    if (!roleLoading) {
      if (!userData?.uid) {
        console.log('UserProfileScreen - No user data, redirecting to login');
        router.replace('/auth/login');
        return;
      }
      
      if (userRole && userRole !== 'user') {
        console.log('UserProfileScreen - Wrong role:', userRole, 'redirecting');
        if (userRole === 'admin' || userRole === 'shopkeeper') {
          router.replace('/(tabs)/_admin-home');
        } else if (userRole === 'super-admin') {
          router.replace('/(tabs)/_super-admin-home');
        }
        return;
      }
    }
  }, [roleLoading, userData, userRole, router]);

  useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.fullName || userData.ownerName || '',
        email: userData.email || '',
        phone: userData.phone || userData.shopPhone || '',
        address: userData.address || ''
      });
    }
  }, [userData]);

  const handleSave = async () => {
    if (!userData?.uid) return;
    
    setLoading(true);
    try {
      // Update Firebase user profile
      const auth = getAuth();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: formData.fullName
        });
      }
      
      // Update Firestore document
      const userDocRef = doc(db, 'users', userData.uid);
      await updateDoc(userDocRef, {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address
      });
      
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const auth = getAuth();
              await signOut(auth);
              // Clear auth data from AsyncStorage
              await clearAuthData();
              dispatch(clearAuth());
              
              // Force navigation to login
              router.replace('/auth/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header with Edit/Save button */}
        <View style={styles.header}>
          <TypographyComponents size="2xl" font="bold" color="#1f2937">
            My Profile
          </TypographyComponents>
          <TouchableOpacity 
            style={[styles.editButton, isEditing && styles.saveButton]}
            onPress={isEditing ? handleSave : () => setIsEditing(true)}
            disabled={loading}
          >
            {loading ? (
              <Ionicons name="time" size={20} color="white" />
            ) : (
              <Ionicons 
                name={isEditing ? "checkmark" : "create"} 
                size={20} 
                color="white" 
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#6b7280" />
            </View>
          </View>
          
          <View style={styles.fieldContainer}>
            <TypographyComponents size="sm" font="medium" color="#6b7280">
              Full Name
            </TypographyComponents>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) => setFormData({...formData, fullName: text})}
                placeholder="Enter your full name"
              />
            ) : (
              <TypographyComponents size="lg" font="bold" color="#1f2937">
                {formData.fullName || 'Not set'}
              </TypographyComponents>
            )}
          </View>
          
          <View style={styles.fieldContainer}>
            <TypographyComponents size="sm" font="medium" color="#6b7280">
              Email
            </TypographyComponents>
            <TypographyComponents size="md" font="reg" color="#6b7280">
              {formData.email || 'Not set'}
            </TypographyComponents>
          </View>
          
          <View style={styles.fieldContainer}>
            <TypographyComponents size="sm" font="medium" color="#6b7280">
              Phone
            </TypographyComponents>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            ) : (
              <TypographyComponents size="md" font="reg" color="#1f2937">
                {formData.phone || 'Not set'}
              </TypographyComponents>
            )}
          </View>
          
          <View style={styles.fieldContainer}>
            <TypographyComponents size="sm" font="medium" color="#6b7280">
              Address
            </TypographyComponents>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => setFormData({...formData, address: text})}
                placeholder="Enter your address"
                multiline
              />
            ) : (
              <TypographyComponents size="md" font="reg" color="#1f2937">
                {formData.address || 'Not set'}
              </TypographyComponents>
            )}
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="settings" size={20} color="#6b7280" />
            <Text style={styles.secondaryButtonText}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="notifications" size={20} color="#6b7280" />
            <Text style={styles.secondaryButtonText}>Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  editButton: {
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  profileCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    marginTop: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    margin: 20,
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 12,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 4,
  },
  tabTextInactive: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 4,
  },
});
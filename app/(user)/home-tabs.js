import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth } from '../../store/slices/authSlice';
import { clearAuthData } from '../../utils/authStorage';

const { width } = Dimensions.get('window');

export default function UserHomeTabs() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { userData } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('home');

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      await clearAuthData();
      dispatch(clearAuth());
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const tabs = [
    { id: 'home', name: 'Home', icon: 'home' },
    { id: 'bookings', name: 'My Bookings', icon: 'calendar' },
    { id: 'profile', name: 'Profile', icon: 'person' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <UserHomeScreen />;
      case 'bookings':
        return <UserBookingsScreen />;
      case 'profile':
        return <UserProfileScreen onLogout={handleLogout} userData={userData} />;
      default:
        return <UserHomeScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={activeTab === tab.id ? `${tab.icon}` : `${tab.icon}-outline`}
              size={24}
              color={activeTab === tab.id ? '#4F46E5' : '#9CA3AF'}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// Individual Tab Screens
function UserHomeScreen() {
  const router = useRouter();
  
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Discover Services Near You</Text>
      <TouchableOpacity 
        style={styles.demoButton}
        onPress={() => router.push('/(tabs)/services')}
      >
        <Text style={styles.demoButtonText}>Browse Services</Text>
      </TouchableOpacity>
    </View>
  );
}

function UserBookingsScreen() {
  const router = useRouter();
  
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>My Bookings</Text>
      <TouchableOpacity 
        style={styles.demoButton}
        onPress={() => router.push('/(tabs)/bookings')}
      >
        <Text style={styles.demoButtonText}>View All Bookings</Text>
      </TouchableOpacity>
    </View>
  );
}

function UserProfileScreen({ onLogout, userData }) {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>My Profile</Text>
      <View style={styles.profileInfo}>
        <Text style={styles.profileText}>Name: {userData?.fullName || 'User'}</Text>
        <Text style={styles.profileText}>Email: {userData?.email || 'user@example.com'}</Text>
      </View>
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={onLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  demoButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  demoButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  profileInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
});
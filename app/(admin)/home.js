import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserRole } from '../../hooks/useUserRole';
import TypographyComponents from '../Components/TypographyComponents';
import { auth, db } from '../services/firebaseconfig';

export default function AdminHomeScreen({ userData }) {
  const router = useRouter();
  const { userRole } = useUserRole();
  const [shopData, setShopData] = useState(userData);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'shopkeeper') {
 
      router.replace('/(user)/home');
    }
  }, [userRole]);

  useEffect(() => {
    const fetchShopData = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            setShopData(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching shop data:', error);
        }
      }
      setLoading(false);
    };
    fetchShopData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <TypographyComponents size="2xl" font="bold" color="#1f2937">
            Dashboard
          </TypographyComponents>
          <TypographyComponents size="md" font="reg" color="#6b7280" style={styles.welcomeSubtitle}>
            Manage your shop
          </TypographyComponents>
        </View>

        {/* Shop Info Card */}
        {shopData && (
          <View style={styles.shopCard}>
            <View style={styles.shopHeader}>
              <View style={styles.shopIconContainer}>
                <Ionicons name="storefront" size={24} color="#6366f1" />
              </View>
              <View style={styles.shopInfo}>
                <TypographyComponents size="xl" font="bold" color="#1f2937">
                  {shopData.shopName || 'My Shop'}
                </TypographyComponents>
                <TypographyComponents size="sm" font="reg" color="#6b7280">
                  {shopData.ownerName || 'Owner'}
                </TypographyComponents>
              </View>
            </View>
            
            {shopData.location?.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color="#6b7280" />
                <TypographyComponents size="sm" font="reg" color="#1f2937" style={styles.infoText}>
                  {shopData.location.address}
                </TypographyComponents>
              </View>
            )}
            
            {shopData.category && (
              <View style={styles.infoRow}>
                <Ionicons name="pricetag" size={16} color="#6b7280" />
                <TypographyComponents size="sm" font="reg" color="#1f2937" style={styles.infoText}>
                  {shopData.category}
                </TypographyComponents>
              </View>
            )}
            
            {shopData.openingTime && shopData.closingTime && (
              <View style={styles.infoRow}>
                <Ionicons name="time" size={16} color="#6b7280" />
                <TypographyComponents size="sm" font="reg" color="#1f2937" style={styles.infoText}>
                  {shopData.openingTime} - {shopData.closingTime}
                </TypographyComponents>
              </View>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <TypographyComponents size="lg" font="medium" color="#1f2937" style={styles.sectionTitle}>
            Quick Actions
          </TypographyComponents>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/services')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="construct" size={24} color="#6366f1" />
              </View>
              <TypographyComponents size="md" font="medium" color="#1f2937" style={styles.actionTitle}>
                Manage Services
              </TypographyComponents>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/bookings')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="calendar" size={24} color="#6366f1" />
              </View>
              <TypographyComponents size="md" font="medium" color="#1f2937" style={styles.actionTitle}>
                View Bookings
              </TypographyComponents>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="settings" size={24} color="#6366f1" />
              </View>
              <TypographyComponents size="md" font="medium" color="#1f2937" style={styles.actionTitle}>
                Edit Profile
              </TypographyComponents>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TypographyComponents size="2xl" font="bold" color="#6366f1" style={styles.statNumber}>
              0
            </TypographyComponents>
            <TypographyComponents size="xs" font="reg" color="#6b7280" style={styles.statLabel}>
              Total Bookings
            </TypographyComponents>
          </View>
          <View style={styles.statCard}>
            <TypographyComponents size="2xl" font="bold" color="#6366f1" style={styles.statNumber}>
              0
            </TypographyComponents>
            <TypographyComponents size="xs" font="reg" color="#6b7280" style={styles.statLabel}>
              Active Services
            </TypographyComponents>
          </View>
          <View style={styles.statCard}>
            <TypographyComponents size="2xl" font="bold" color="#6366f1" style={styles.statNumber}>
              0
            </TypographyComponents>
            <TypographyComponents size="xs" font="reg" color="#6b7280" style={styles.statLabel}>
              Reviews
            </TypographyComponents>
          </View>
        </View>
      </ScrollView>
      
      {/* CUSTOM TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => {
            router.push('/(tabs)/_admin-home');
          }}
        >
          <Ionicons 
            name={'home'} 
            size={24} 
            color={'#4F46E5'} 
          />
          <TypographyComponents size="xs" font="medium" color="#4F46E5" style={styles.tabText}>
            Home
          </TypographyComponents>
        </TouchableOpacity>
            
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => {
            router.push('/(tabs)/bookings');
          }}
        >
          <Ionicons 
            name={'calendar-outline'} 
            size={24} 
            color={'#9CA3AF'} 
          />
          <TypographyComponents size="xs" font="medium" color="#9CA3AF" style={styles.tabText}>
            Bookings
          </TypographyComponents>
        </TouchableOpacity>
            
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => {
            router.push('/(tabs)/profile');
          }}
        >
          <Ionicons 
            name={'person-outline'} 
            size={24} 
            color={'#9CA3AF'} 
          />
          <TypographyComponents size="xs" font="medium" color="#9CA3AF" style={styles.tabText}>
            Profile
          </TypographyComponents>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  welcomeSection: {
    marginBottom: 24,
  },
  shopCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  shopIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shopIcon: {
    fontSize: 30,
  },
  shopInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Tab Bar
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
    marginTop: 4,
  },
  
  // Updated component styles
  welcomeSubtitle: {
    marginTop: 4,
  },
  
  infoText: {
    marginLeft: 8,
  },
  
  sectionTitle: {
    marginBottom: 16,
  },
  
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  actionTitle: {
    textAlign: 'center',
  },
  
  statNumber: {
    textAlign: 'center',
  },
});
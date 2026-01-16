import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TypographyComponents from '../Components/TypographyComponents';
import { auth, db } from '../services/firebaseconfig';

export default function AdminHomeScreen({ userData }) {
  const router = useRouter();
  const [shopData, setShopData] = useState(userData);
  const [loading, setLoading] = useState(true);

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
          <TypographyComponents size="2xl" font="bold" other="text-gray-800">
            Dashboard
          </TypographyComponents>
          <TypographyComponents size="md" font="reg" other="text-gray-600 mt-1">
            Manage your shop
          </TypographyComponents>
        </View>

        {/* Shop Info Card */}
        {shopData && (
          <View style={styles.shopCard}>
            <View style={styles.shopHeader}>
              <View style={styles.shopIconContainer}>
                <Text style={styles.shopIcon}>🏪</Text>
              </View>
              <View style={styles.shopInfo}>
                <TypographyComponents size="xl" font="bold" other="text-gray-800">
                  {shopData.shopName || 'My Shop'}
                </TypographyComponents>
                <TypographyComponents size="sm" font="reg" other="text-gray-600">
                  {shopData.ownerName || 'Owner'}
                </TypographyComponents>
              </View>
            </View>
            
            {shopData.location?.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📍 Address:</Text>
                <Text style={styles.infoValue}>{shopData.location.address}</Text>
              </View>
            )}
            
            {shopData.category && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>🏷️ Category:</Text>
                <Text style={styles.infoValue}>{shopData.category}</Text>
              </View>
            )}
            
            {shopData.openingTime && shopData.closingTime && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>🕐 Hours:</Text>
                <Text style={styles.infoValue}>
                  {shopData.openingTime} - {shopData.closingTime}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <TypographyComponents size="lg" font="medium" other="text-gray-800 mb-4">
            Quick Actions
          </TypographyComponents>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/services')}
            >
              <Text style={styles.actionIcon}>🔧</Text>
              <TypographyComponents size="md" font="medium" other="text-gray-800 mt-2">
                Manage Services
              </TypographyComponents>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/bookings')}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <TypographyComponents size="md" font="medium" other="text-gray-800 mt-2">
                View Bookings
              </TypographyComponents>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.actionIcon}>⚙️</Text>
              <TypographyComponents size="md" font="medium" other="text-gray-800 mt-2">
                Edit Profile
              </TypographyComponents>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Active Services</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>
      </ScrollView>
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
});

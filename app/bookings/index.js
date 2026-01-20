import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserRole } from '../../hooks/useUserRole';
import { db } from '../services/firebaseconfig';

export default function BookingsIndexScreen() {
  const router = useRouter();
  const { userData, userRole, loading: roleLoading } = useUserRole();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [waitingForUser, setWaitingForUser] = useState(true);

  // Add a delay to wait for user data to load from cache/Firebase
  useEffect(() => {
    const timer = setTimeout(() => {
      setWaitingForUser(false);
    }, 3000); // Wait 3 seconds for user data to load

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('BookingsIndex - Effect triggered:', {
      roleLoading,
      userRole,
      userDataUid: userData?.uid,
      hasAttemptedFetch,
      waitingForUser
    });
    
    // Only fetch when we have complete user data and haven't attempted yet
    if (!roleLoading && userRole && userData?.uid && !hasAttemptedFetch) {
      console.log('Fetching bookings for user:', userData.uid, 'role:', userRole);
      setHasAttemptedFetch(true);
      setWaitingForUser(false);
      fetchBookings();
    } else if (!roleLoading && !userData?.uid && !hasAttemptedFetch && !waitingForUser) {
      // If no user data after loading is complete and we've waited, stop loading
      console.log('No user data found after waiting, showing empty state');
      setHasAttemptedFetch(true);
      setLoading(false);
      setBookings([]);
    }
  }, [roleLoading, userRole, userData?.uid, hasAttemptedFetch, waitingForUser]);

  const fetchBookings = async () => {
    if (!userData?.uid) {
      setBookings([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    setLoading(true);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Booking fetch timeout - showing empty state');
      setLoading(false);
      setRefreshing(false);
      setBookings([]);
    }, 8000); // 8 second timeout
    
    try {
      let querySnapshot;
      
      if (userRole === 'user') {
        // For users, show their bookings
        const q = query(
          collection(db, 'bookings'), 
          where('userId', '==', userData.uid)
        );
        querySnapshot = await getDocs(q);
      } else if (userRole === 'admin' || userRole === 'shopkeeper') {
        // For admins/shopkeepers, show bookings for their services
        const q = query(
          collection(db, 'bookings'), 
          where('providerId', '==', userData.uid)
        );
        querySnapshot = await getDocs(q);
      } else {
        // For super-admin, show all bookings
        const q = query(collection(db, 'bookings'));
        querySnapshot = await getDocs(q);
      }
      
      clearTimeout(timeoutId); // Clear timeout if successful
      
      const bookingsData = [];
      if (querySnapshot && querySnapshot.docs) {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data && doc.id) {
            bookingsData.push({
              id: doc.id,
              ...data
            });
          }
        });
      }
      
      // Sort by creation date (newest first)
      bookingsData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          const aTime = a.createdAt.seconds || 0;
          const bTime = b.createdAt.seconds || 0;
          return bTime - aTime;
        }
        return 0;
      });
      
      setBookings(bookingsData);
      console.log(`Loaded ${bookingsData.length} bookings for ${userRole}`);
    } catch (error) {
      clearTimeout(timeoutId); // Clear timeout on error
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setHasAttemptedFetch(false); // Reset attempt flag to allow refetch
    if (userData?.uid && userRole) {
      fetchBookings();
    } else {
      setRefreshing(false);
      setBookings([]);
    }
  };

  const BookingCard = ({ item }) => {
    if (!item || !item.id) return null;

    const getStatusColor = (status) => {
      switch(status) {
        case 'confirmed': return '#10B981';
        case 'completed': return '#3B82F6';
        case 'cancelled': return '#EF4444';
        case 'pending': return '#F59E0B';
        default: return '#6B7280';
      }
    };

    const getStatusIcon = (status) => {
      switch(status) {
        case 'confirmed': return 'checkmark-circle';
        case 'completed': return 'checkbox';
        case 'cancelled': return 'close-circle';
        case 'pending': return 'time';
        default: return 'ellipse';
      }
    };

    const serviceName = item.serviceName || 'Service';
    const displayName = userRole === 'user' ? (item.providerName || 'Provider') : (item.userName || 'Customer');
    const bookingDate = item.bookingDate || 'Date not set';
    const bookingTime = item.bookingTime || 'Time not set';
    const status = item.status || 'pending';

    return (
      <TouchableOpacity 
        style={styles.bookingCard}
        onPress={() => router.push(`/bookings/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.infoRow}>
            <View style={styles.iconBg}>
              <Ionicons name="briefcase" size={20} color="#6366F1" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.mainTitle}>{serviceName}</Text>
              <Text style={styles.serviceProvider}>{displayName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.dateTimeRow}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" />
            <Text style={styles.dateTimeText}>{bookingDate}</Text>
          </View>
          <View style={styles.dateItem}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.dateTimeText}>{bookingTime}</Text>
          </View>
        </View>

        <View style={[styles.statusChip, { backgroundColor: `${getStatusColor(status)}20` }]}>
          <Ionicons 
            name={getStatusIcon(status)} 
            size={14} 
            color={getStatusColor(status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (roleLoading || waitingForUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>
            {roleLoading ? 'Initializing...' : 'Loading user data...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state immediately if no user data
  if (!userData?.uid) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bookings</Text>
          <Text style={styles.headerSub}>No user data available</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={60} color="#CBD5E1" />
          <Text style={styles.emptyText}>Please log in to view bookings</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {userRole === 'user' ? 'My Bookings' : 'Booking Requests'}
          </Text>
          <Text style={styles.headerSub}>
            {userRole === 'user' ? 'Track your service history' : 'Manage customer bookings'}
          </Text>
        </View>
        {loading && (
          <ActivityIndicator size="small" color="#4F46E5" />
        )}
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookingCard item={item} />}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              {loading ? 'Loading bookings...' : 'No bookings found'}
            </Text>
            {!loading && userData?.uid && (
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => {
                  setHasAttemptedFetch(false);
                  fetchBookings();
                }}
              >
                <Ionicons name="refresh" size={16} color="#4F46E5" />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSub: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  serviceProvider: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  retryText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
    marginLeft: 6,
  },
});
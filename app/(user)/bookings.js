import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserRole } from '../../hooks/useUserRole';
import { db } from '../services/firebaseconfig';

export default function UserBookingsScreen() {
  const router = useRouter();
  const { userData, userRole } = useUserRole();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    if (!userData?.uid) return;
    
    try {
      const q = query(
        collection(db, 'bookings'), 
        where('userId', '==', userData.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const bookingsData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          // Sort by createdAt descending (newest first)
          if (a.createdAt && b.createdAt) {
            return b.createdAt.seconds - a.createdAt.seconds;
          }
          return 0;
        });
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const BookingCard = ({ item }) => {
    const isConfirmed = item.status === 'confirmed';
    const isCompleted = item.status === 'completed';
    const isCancelled = item.status === 'cancelled';
    const isPending = item.status === 'pending';

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
              <Text style={styles.mainTitle}>{item.serviceName}</Text>
              <Text style={styles.serviceProvider}>{item.userName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.dateTimeRow}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" />
            <Text style={styles.dateTimeText}>{item.bookingDate}</Text>
          </View>
          <View style={styles.dateItem}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.dateTimeText}>{item.bookingTime}</Text>
          </View>
        </View>

        {/* Status Chip */}
        <View style={[
          styles.statusChip, 
          isConfirmed ? styles.chipConfirmed : isCompleted ? styles.chipCompleted : isCancelled ? styles.chipCancelled : styles.chipPending
        ]}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={14} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[
            styles.statusText, 
            { color: getStatusColor(item.status) }
          ]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="time" size={60} color="#CBD5E1" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSub}>Track your service history</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookingCard item={item} />}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        }
      />

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => {
            router.push('/(user)/home');
          }}
        >
          <Ionicons 
            name={'home-outline'} 
            size={24} 
            color={'#9CA3AF'} 
          />
          <Text style={styles.tabTextInactive}>Home</Text>
        </TouchableOpacity>
            
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => {
            router.push('/(user)/bookings');
          }}
        >
          <Ionicons 
            name={'calendar'} 
            size={24} 
            color={'#4F46E5'} 
          />
          <Text style={styles.tabText}>Bookings</Text>
        </TouchableOpacity>
            
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => {
            router.push('/(user)/profile');
          }}
        >
          <Ionicons 
            name={'person-outline'} 
            size={24} 
            color={'#9CA3AF'} 
          />
          <Text style={styles.tabTextInactive}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  chipConfirmed: {
    backgroundColor: '#ECFDF5',
  },
  chipCompleted: {
    backgroundColor: '#DBEAFE',
  },
  chipCancelled: {
    backgroundColor: '#FEF2F2',
  },
  chipPending: {
    backgroundColor: '#FFFBEB',
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserRole } from '../../hooks/useUserRole';
import { db } from '../services/firebaseconfig';

export default function BookingsScreen() {
  const router = useRouter();
  const { userRole, userData } = useUserRole();
  const [activeTab, setActiveTab] = useState('Pending');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [userRole]);

  const fetchBookings = async () => {
    if (!userData?.uid) return;
    
    try {
      let q;
      if (userRole === 'admin' || userRole === 'shopkeeper') {
        q = query(
          collection(db, 'bookings'), 
          where('serviceProviderId', '==', userData.uid)
        );
      } else {
        // Fetch bookings for user
        q = query(
          collection(db, 'bookings'), 
          where('userId', '==', userData.uid)
        );
      }
      
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

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { status: newStatus });
      // Update local state
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    } catch (error) {
      console.error('Error updating booking status:', error);
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

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.infoRow}>
            <View style={styles.iconBg}>
              <Ionicons name={userRole === 'admin' || userRole === 'shopkeeper' ? "person" : "business"} size={20} color="#6366F1" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.mainTitle}>
                {userRole === 'admin' || userRole === 'shopkeeper' ? item.userName : item.serviceName}
              </Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.ratingText}>{item.serviceName}</Text>
              </View>
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

        {/* Action Buttons for Admin (Shopkeeper) */}
        {(userRole === 'admin' || userRole === 'shopkeeper') && item.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.rejectBtn} 
              onPress={() => handleStatusUpdate(item.id, 'cancelled')}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.acceptBtn} 
              onPress={() => handleStatusUpdate(item.id, 'confirmed')}
            >
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status Chips */}
        {(item.status !== 'pending' || userRole === 'user') && (
          <View style={[
            styles.statusChip, 
            isConfirmed ? styles.chipConfirmed : isCompleted ? styles.chipCompleted : isCancelled ? styles.chipCancelled : styles.chipPending
          ]}>
            <Ionicons 
              name={isConfirmed ? "checkmark-circle" : isCompleted ? "checkbox" : isCancelled ? "close-circle" : "time"} 
              size={14} 
              color={isConfirmed ? "#10B981" : isCompleted ? "#3B82F6" : isCancelled ? "#EF4444" : "#F59E0B"} 
            />
            <Text style={[
              styles.statusText, 
              { color: isConfirmed ? "#10B981" : isCompleted ? "#3B82F6" : isCancelled ? "#EF4444" : "#F59E0B" }
            ]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        )}
      </View>
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
        <Text style={styles.headerTitle}>Bookings</Text>
        <Text style={styles.headerSub}>
          {userRole === 'admin' || userRole === 'shopkeeper' ? "Manage incoming requests" : "Track your service history"}
        </Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/bookings/${item.id}`)}>
            <BookingCard item={item} />
          </TouchableOpacity>
        )}
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
    </SafeAreaView>
  );
};

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
  card: {
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  rejectBtn: {
    backgroundColor: '#FECACA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  acceptBtn: {
    backgroundColor: '#BBF7D0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtnText: {
    color: '#16A34A',
    fontWeight: '600',
    fontSize: 14,
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
});


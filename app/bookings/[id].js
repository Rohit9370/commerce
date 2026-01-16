import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../services/firebaseconfig';

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', id));
      if (bookingDoc.exists()) {
        setBooking({ id: bookingDoc.id, ...bookingDoc.data() });
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="time" size={60} color="#CBD5E1" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#EF4444" />
          <Text style={styles.errorText}>Booking not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isConfirmed = booking.status === 'confirmed';
  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';
  const isPending = booking.status === 'pending';

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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 24 }} /> {/* Spacer for alignment */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[
            styles.statusChip, 
            isConfirmed ? styles.chipConfirmed : isCompleted ? styles.chipCompleted : isCancelled ? styles.chipCancelled : styles.chipPending
          ]}>
            <Ionicons 
              name={getStatusIcon(booking.status)} 
              size={16} 
              color={getStatusColor(booking.status)} 
            />
            <Text style={[
              styles.statusText, 
              { color: getStatusColor(booking.status) }
            ]}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>
          <Text style={styles.statusTextDesc}>
            {booking.status === 'confirmed' && 'Your appointment is confirmed'}
            {booking.status === 'completed' && 'Service has been completed'}
            {booking.status === 'cancelled' && 'Booking has been cancelled'}
            {booking.status === 'pending' && 'Waiting for confirmation'}
          </Text>
        </View>

        {/* Service Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase" size={20} color="#6B7280" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Service Name</Text>
              <Text style={styles.infoValue}>{booking.serviceName}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color="#6B7280" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Provider</Text>
              <Text style={styles.infoValue}>{booking.userName}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cash" size={20} color="#6B7280" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Price</Text>
              <Text style={styles.infoValue}>₹{booking.price}</Text>
            </View>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color="#6B7280" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{booking.bookingDate}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#6B7280" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{booking.bookingTime}</Text>
            </View>
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Booking ID</Text>
              <Text style={styles.infoValue}>{booking.id}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="receipt" size={20} color="#6B7280" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Created At</Text>
              <Text style={styles.infoValue}>
                {booking.createdAt ? new Date(booking.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Provider */}
        {booking.status !== 'cancelled' && (
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="call" size={20} color="white" />
            <Text style={styles.contactButtonText}>Contact Provider</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
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
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusTextDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  contactButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 16,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
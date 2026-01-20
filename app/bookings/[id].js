import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { borderRadius, colors, shadows, spacing } from '../../src/constants/theme';
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

  const getStatusGradient = (status) => {
    switch(status) {
      case 'confirmed': return ['#10B981', '#059669'];
      case 'completed': return ['#3B82F6', '#2563EB'];
      case 'cancelled': return ['#EF4444', '#DC2626'];
      case 'pending': return ['#F59E0B', '#D97706'];
      default: return ['#6B7280', '#4B5563'];
    }
  };

  const getStatusDescription = (status) => {
    switch(status) {
      case 'confirmed': return 'Your appointment is confirmed and ready';
      case 'completed': return 'Service has been successfully completed';
      case 'cancelled': return 'This booking has been cancelled';
      case 'pending': return 'Waiting for provider confirmation';
      default: return 'Status unknown';
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
      {/* Modern Header */}
      <LinearGradient
        colors={colors.gradients.primary}
        style={styles.modernHeader}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={getStatusGradient(booking.status)}
            style={styles.statusGradient}
          >
            <View style={styles.statusIconContainer}>
              <Ionicons 
                name={getStatusIcon(booking.status)} 
                size={32} 
                color={colors.white} 
              />
            </View>
            <Text style={styles.statusTitle}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
            <Text style={styles.statusDescription}>
              {getStatusDescription(booking.status)}
            </Text>
          </LinearGradient>
        </View>

        {/* Service Info */}
        <View style={styles.modernSection}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="briefcase" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Service</Text>
                <Text style={styles.infoValue}>{booking.serviceName}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Provider</Text>
                <Text style={styles.infoValue}>{booking.userName}</Text>
              </View>
            </View>
            
            {booking.price && (
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="cash" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Price</Text>
                  <Text style={styles.infoValue}>₹{booking.price}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.modernSection}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.scheduleContainer}>
            <View style={styles.scheduleItem}>
              <LinearGradient
                colors={['#EFF6FF', '#DBEAFE']}
                style={styles.scheduleGradient}
              >
                <Ionicons name="calendar" size={24} color={colors.info} />
                <Text style={styles.scheduleLabel}>Date</Text>
                <Text style={styles.scheduleValue}>{booking.bookingDate}</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.scheduleItem}>
              <LinearGradient
                colors={['#F0FDF4', '#DCFCE7']}
                style={styles.scheduleGradient}
              >
                <Ionicons name="time" size={24} color={colors.success} />
                <Text style={styles.scheduleLabel}>Time</Text>
                <Text style={styles.scheduleValue}>{booking.bookingTime}</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.modernSection}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booking ID</Text>
              <Text style={styles.detailValue}>{booking.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>
                {booking.createdAt ? 
                  (typeof booking.createdAt === 'string' ? 
                    new Date(booking.createdAt).toLocaleDateString() : 
                    new Date(booking.createdAt.seconds * 1000).toLocaleDateString()
                  ) : 'N/A'}
              </Text>
            </View>
            {booking.specialRequest && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Special Request</Text>
                <Text style={styles.detailValue}>{booking.specialRequest}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {booking.status !== 'cancelled' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.contactButton}>
              <LinearGradient
                colors={colors.gradients.secondary}
                style={styles.buttonGradient}
              >
                <Ionicons name="call" size={20} color={colors.white} />
                <Text style={styles.buttonText}>Contact Provider</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {booking.status === 'confirmed' && (
              <TouchableOpacity style={styles.chatButton}>
                <LinearGradient
                  colors={colors.gradients.primary}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="chatbubble" size={20} color={colors.white} />
                  <Text style={styles.buttonText}>Start Chat</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  modernHeader: {
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    margin: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  statusGradient: {
    padding: spacing['3xl'],
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.md,
  },
  statusDescription: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  modernSection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  infoGrid: {
    gap: spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scheduleContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  scheduleItem: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  scheduleGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  scheduleLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  scheduleValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  detailsContainer: {
    gap: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 2,
    textAlign: 'right',
  },
  actionsContainer: {
    marginHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  contactButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  chatButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
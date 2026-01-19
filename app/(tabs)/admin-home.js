import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { Button, Card, Typography } from '../../src/components/ui';
import { colors, spacing } from '../../src/constants/theme';
import {
    fetchShopkeeperBookings,
    selectBookingsLoading,
    selectShopkeeperBookings,
    updateBookingStatus
} from '../../store/slices/bookingsSlice';
import {
    fetchShopServices,
    selectShopServices
} from '../../store/slices/servicesSlice';
import { db } from '../services/firebaseconfig';

const AdminHomeScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { uid, role, userData } = useSelector((state) => state.auth);
  
  const [shopData, setShopData] = useState(userData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const bookings = useSelector(selectShopkeeperBookings);
  const services = useSelector(selectShopServices);
  const bookingsLoading = useSelector(selectBookingsLoading);

  // Redirect non-admin users
  useEffect(() => {
    if (role && role !== 'admin' && role !== 'shopkeeper') {
      if (role === 'user') {
        router.replace('/(tabs)/home');
      } else if (role === 'super-admin') {
        router.replace('/(tabs)/super-admin-home');
      }
    }
  }, [role]);

  useEffect(() => {
    if (uid) {
      fetchData();
    }
  }, [uid]);

  const fetchData = async () => {
    try {
      // Fetch shop data
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setShopData(userDoc.data());
      }

      // Fetch bookings and services from Redux
      dispatch(fetchShopkeeperBookings(uid));
      dispatch(fetchShopServices(uid));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      await dispatch(updateBookingStatus({ bookingId, status: action })).unwrap();
      Alert.alert('Success', `Booking ${action} successfully`);
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} booking`);
    }
  };

  // Calculate stats
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const acceptedBookings = bookings.filter(b => b.status === 'accepted');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const activeServices = services.filter(s => s.isActive).length;

  const StatCard = ({ title, value, icon, color = colors.primary, onPress }) => (
    <Card style={styles.statCard} onPress={onPress}>
      <View style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.statInfo}>
          <Typography variant="h4" weight="bold" color="primary">
            {value}
          </Typography>
          <Typography variant="body2" color="secondary">
            {title}
          </Typography>
        </View>
      </View>
    </Card>
  );

  const BookingCard = ({ booking }) => (
    <Card style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Typography variant="h6" weight="semiBold">
            {booking.serviceName}
          </Typography>
          <Typography variant="body2" color="secondary">
            {booking.userName}
          </Typography>
          <Typography variant="caption" color="secondary">
            {booking.date} at {booking.time}
          </Typography>
        </View>
        <View style={[
          styles.statusBadge,
          booking.status === 'pending' && styles.pendingBadge,
          booking.status === 'accepted' && styles.acceptedBadge,
          booking.status === 'completed' && styles.completedBadge,
        ]}>
          <Typography 
            variant="caption" 
            weight="medium"
            color={
              booking.status === 'pending' ? 'warning' :
              booking.status === 'accepted' ? 'info' : 'success'
            }
          >
            {booking.status.toUpperCase()}
          </Typography>
        </View>
      </View>
      
      {booking.status === 'pending' && (
        <View style={styles.bookingActions}>
          <Button
            title="Reject"
            variant="outline"
            size="small"
            style={[styles.actionButton, { borderColor: colors.error }]}
            textStyle={{ color: colors.error }}
            onPress={() => handleBookingAction(booking.id, 'rejected')}
          />
          <Button
            title="Accept"
            size="small"
            style={styles.actionButton}
            onPress={() => handleBookingAction(booking.id, 'accepted')}
          />
        </View>
      )}
      
      {booking.status === 'accepted' && (
        <View style={styles.bookingActions}>
          <Button
            title="Mark Complete"
            variant="secondary"
            size="small"
            style={styles.actionButton}
            onPress={() => handleBookingAction(booking.id, 'completed')}
          />
          <Button
            title="Chat"
            size="small"
            style={styles.actionButton}
            onPress={() => router.push(`/chat/${booking.id}`)}
          />
        </View>
      )}
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="body1" color="secondary" style={{ marginTop: 16 }}>
            Loading dashboard...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Typography variant="h4" weight="bold">
              Dashboard
            </Typography>
            <Typography variant="body2" color="secondary">
              Welcome back, {shopData?.shopName || shopData?.fullName}
            </Typography>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Bookings"
            value={totalBookings}
            icon="calendar-outline"
            color={colors.primary}
            onPress={() => router.push('/(tabs)/bookings')}
          />
          <StatCard
            title="Pending"
            value={pendingBookings.length}
            icon="time-outline"
            color={colors.warning}
            onPress={() => router.push('/(tabs)/bookings?filter=pending')}
          />
          <StatCard
            title="Active Services"
            value={activeServices}
            icon="construct-outline"
            color={colors.success}
            onPress={() => router.push('/(tabs)/admin-services')}
          />
          <StatCard
            title="Completed"
            value={completedBookings.length}
            icon="checkmark-circle-outline"
            color={colors.info}
            onPress={() => router.push('/(tabs)/bookings?filter=completed')}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Typography variant="h6" weight="semiBold" style={{ marginBottom: 12 }}>
            Quick Actions
          </Typography>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/admin-services')}
            >
              <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
              <Typography variant="body2" color="primary" weight="medium">
                Add Service
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/bookings')}
            >
              <Ionicons name="calendar-outline" size={32} color={colors.primary} />
              <Typography variant="body2" color="primary" weight="medium">
                View Bookings
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="storefront-outline" size={32} color={colors.primary} />
              <Typography variant="body2" color="primary" weight="medium">
                Shop Settings
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="h6" weight="semiBold">
              Recent Bookings
            </Typography>
            <TouchableOpacity onPress={() => router.push('/(tabs)/bookings')}>
              <Typography variant="body2" color="primary">
                View All
              </Typography>
            </TouchableOpacity>
          </View>
          
          {bookingsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : bookings.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Typography variant="body1" color="secondary" align="center">
                No bookings yet
              </Typography>
              <Typography variant="body2" color="tertiary" align="center">
                Bookings will appear here when customers book your services
              </Typography>
            </Card>
          ) : (
            bookings.slice(0, 3).map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  settingsButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    marginRight: '2%',
    marginBottom: spacing.sm,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  bookingCard: {
    marginBottom: spacing.sm,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: colors.statusBg.warning,
  },
  acceptedBadge: {
    backgroundColor: colors.statusBg.info,
  },
  completedBadge: {
    backgroundColor: colors.statusBg.success,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
    minWidth: 80,
  },
  emptyCard: {
    padding: spacing.lg,
  },
});

export default AdminHomeScreen;
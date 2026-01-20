import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { Button, Card, Input, Typography } from '../../src/components/ui';
import { colors, spacing } from '../../src/constants/theme';
import {
  fetchShopkeeperBookings,
  fetchUserBookings,
  selectBookingsLoading,
  selectShopkeeperBookings,
  selectUserBookings,
  updateBookingStatus
} from '../../store/slices/bookingsSlice';

const BookingsScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { filter } = useLocalSearchParams();
  
  const { uid, role } = useSelector((state) => state.auth);
  const userBookings = useSelector(selectUserBookings);
  const shopkeeperBookings = useSelector(selectShopkeeperBookings);
  const loading = useSelector(selectBookingsLoading);
  
  const [activeFilter, setActiveFilter] = useState(filter || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const isShopkeeper = role === 'admin' || role === 'shopkeeper' || role === 'super-admin';
  const bookings = isShopkeeper ? shopkeeperBookings : userBookings;

  useEffect(() => {
    if (uid) {
      fetchBookings();
    }
  }, [uid, role]);

  useEffect(() => {
    if (filter) {
      setActiveFilter(filter);
    }
  }, [filter]);

  const fetchBookings = () => {
    if (isShopkeeper) {
      dispatch(fetchShopkeeperBookings(uid));
    } else {
      dispatch(fetchUserBookings(uid));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    fetchBookings();
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

  const handleCancelBooking = (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: () => handleBookingAction(bookingId, 'cancelled')
        },
      ]
    );
  };

  const getFilteredBookings = () => {
    let filtered = [...bookings];


    if (activeFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === activeFilter);
    }

 
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.serviceName?.toLowerCase().includes(query) ||
        booking.shopName?.toLowerCase().includes(query) ||
        booking.userName?.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  const FilterButton = ({ title, value, count }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === value && styles.activeFilterButton,
      ]}
      onPress={() => setActiveFilter(value)}
    >
      <Typography
        variant="body2"
        color={activeFilter === value ? "inverse" : "secondary"}
        weight="medium"
      >
        {title} {count !== undefined && `(${count})`}
      </Typography>
    </TouchableOpacity>
  );

  const BookingCard = ({ booking }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'pending': return colors.warning;
        case 'accepted': return colors.info;
        case 'completed': return colors.success;
        case 'cancelled': return colors.error;
        case 'rejected': return colors.error;
        default: return colors.gray[500];
      }
    };

    const canChat = booking.status === 'accepted';
    const canCancel = booking.status === 'pending' || booking.status === 'accepted';
    const isPending = booking.status === 'pending';

    return (
      <Card style={styles.bookingCard} onPress={() => router.push(`/bookings/${booking.id}`)}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingInfo}>
            <Typography variant="h6" weight="semiBold" numberOfLines={1}>
              {booking.serviceName}
            </Typography>
            <Typography variant="body2" color="secondary" numberOfLines={1}>
              {isShopkeeper ? `Customer: ${booking.userName}` : `Shop: ${booking.shopName}`}
            </Typography>
            <View style={styles.bookingMeta}>
              <View style={styles.dateTime}>
                <Ionicons name="calendar-outline" size={14} color={colors.gray[500]} />
                <Typography variant="caption" color="secondary">
                  {booking.date}
                </Typography>
              </View>
              <View style={styles.dateTime}>
                <Ionicons name="time-outline" size={14} color={colors.gray[500]} />
                <Typography variant="caption" color="secondary">
                  {booking.time}
                </Typography>
              </View>
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}20` }]}>
            <Typography 
              variant="caption" 
              weight="medium"
              style={{ color: getStatusColor(booking.status) }}
            >
              {booking.status.toUpperCase()}
            </Typography>
          </View>
        </View>

        {booking.price && (
          <View style={styles.priceContainer}>
            <Typography variant="h6" weight="bold" color="primary">
              ₹{booking.price}
            </Typography>
          </View>
        )}

        {/* Actions */}
        <View style={styles.bookingActions}>
          {/* Shopkeeper Actions */}
          {isShopkeeper && isPending && (
            <>
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
            </>
          )}

          {isShopkeeper && booking.status === 'accepted' && (
            <Button
              title="Mark Complete"
              variant="secondary"
              size="small"
              style={styles.actionButton}
              onPress={() => handleBookingAction(booking.id, 'completed')}
            />
          )}

          {/* Chat Button */}
          {canChat && (
            <Button
              title="Chat"
              variant="outline"
              size="small"
              style={styles.actionButton}
              onPress={() => router.push(`/chat/${booking.id}`)}
            />
          )}

          {/* User Actions */}
          {!isShopkeeper && canCancel && (
            <Button
              title="Cancel"
              variant="outline"
              size="small"
              style={[styles.actionButton, { borderColor: colors.error }]}
              textStyle={{ color: colors.error }}
              onPress={() => handleCancelBooking(booking.id)}
            />
          )}

          {/* View Details */}
          <Button
            title="Details"
            variant="ghost"
            size="small"
            style={styles.actionButton}
            onPress={() => router.push(`/bookings/${booking.id}`)}
          />
        </View>
      </Card>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color={colors.gray[400]} />
      <Typography variant="h6" color="secondary" style={{ marginTop: 16 }}>
        No bookings found
      </Typography>
      <Typography variant="body2" color="tertiary" align="center" style={{ marginTop: 8 }}>
        {isShopkeeper 
          ? "Bookings from customers will appear here"
          : "Your service bookings will appear here"
        }
      </Typography>
      {!isShopkeeper && (
        <Button
          title="Browse Services"
          style={{ marginTop: 24 }}
          onPress={() => router.push('/(tabs)/home')}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h4" weight="bold">
          {isShopkeeper ? 'Customer Bookings' : 'My Bookings'}
        </Typography>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={24} color={colors.gray[600]} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search bookings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          style={styles.searchInput}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { title: 'All', value: 'all', count: bookings.length },
            { title: 'Pending', value: 'pending', count: bookings.filter(b => b.status === 'pending').length },
            { title: 'Accepted', value: 'accepted', count: bookings.filter(b => b.status === 'accepted').length },
            { title: 'Completed', value: 'completed', count: bookings.filter(b => b.status === 'completed').length },
            { title: 'Cancelled', value: 'cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
          ]}
          renderItem={({ item }) => (
            <FilterButton title={item.title} value={item.value} count={item.count} />
          )}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {/* Bookings List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={({ item }) => <BookingCard booking={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={EmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  filtersContainer: {
    marginBottom: spacing.md,
  },
  filtersContent: {
    paddingHorizontal: spacing.md,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
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
    marginRight: 12,
  },
  bookingMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceContainer: {
    marginBottom: 12,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  actionButton: {
    marginLeft: 8,
    marginTop: 4,
    minWidth: 70,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default BookingsScreen;
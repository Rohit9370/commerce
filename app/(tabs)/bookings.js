import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useUserRole } from "../../hooks/useUserRole";
import { selectAuth } from "../../store";
import {
    cancelBooking,
    confirmBooking,
    fetchShopkeeperBookings,
    fetchUserBookings,
    selectBookingsLoading,
    selectShopkeeperBookings,
    selectUserBookings,
    updateBookingStatus,
} from "../../store/slices/bookingsSlice";

export default function HistoryScreen() {
  const router = useRouter();
  const { userRole } = useUserRole();
  const dispatch = useDispatch();
  const { uid } = useSelector(selectAuth);
  
  // Different bookings based on user role
  const shopkeeperBookings = useSelector(selectShopkeeperBookings);
  const userBookings = useSelector(selectUserBookings);
  const bookingsLoading = useSelector(selectBookingsLoading);
  
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // all, completed, rejected, pending, confirmed, cancelled

  useEffect(() => {
    if (uid) {
      if (userRole === "admin" || userRole === "shopkeeper") {
        // Service providers fetch their own bookings (from customers)
        dispatch(fetchShopkeeperBookings(uid));
      } else {
        // Regular users fetch their own bookings
        dispatch(fetchUserBookings(uid));
      }
    }
  }, [uid, userRole, dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (uid) {
      if (userRole === "admin" || userRole === "shopkeeper") {
        await dispatch(fetchShopkeeperBookings(uid));
      } else {
        await dispatch(fetchUserBookings(uid));
      }
    }
    setRefreshing(false);
  };

  // Get the correct bookings list based on role
  const bookings = (userRole === "admin" || userRole === "shopkeeper") ? shopkeeperBookings : userBookings;

  // Filter bookings based on status
  const filteredBookings = bookings.filter((booking) => {
    if (statusFilter === "all") {
      return true; // Show all bookings
    }
    return booking.status === statusFilter;
  });

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      let action;
      switch(newStatus) {
        case 'confirmed':
          action = confirmBooking(bookingId);
          break;
        case 'cancelled':
          action = cancelBooking(bookingId);
          break;
        default:
          action = updateBookingStatus({ bookingId, status: newStatus });
          break;
      }
      
      await dispatch(action);
      // Refresh bookings after status update
      if (uid) {
        if (userRole === "admin" || userRole === "shopkeeper") {
          await dispatch(fetchShopkeeperBookings(uid));
        } else {
          await dispatch(fetchUserBookings(uid));
        }
      }
    } catch (error) {
      Alert.alert("Error", `Failed to update booking status: ${error.message}`);
    }
  };

  const renderBookingCard = ({ item }) => {
    const statusColor =
      item.status === "completed"
        ? "#10b981"
        : item.status === "rejected" || item.status === "cancelled"
          ? "#ef4444"
          : item.status === "pending"
            ? "#f59e0b"
            : item.status === "confirmed"
              ? "#3b82f6"
              : "#6b7280";
    const statusLabel =
      item.status.charAt(0).toUpperCase() + item.status.slice(1);

    return (
      <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <Text style={styles.customerName}>{item.userName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}> 
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="calendar" size={14} color="#6b7280" />
            <Text style={styles.footerText}>
              {item.bookingDate
                ? new Date(item.bookingDate).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="time" size={14} color="#6b7280" />
            <Text style={styles.footerText}>{item.bookingTime || "N/A"}</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="cash" size={14} color="#4f46e5" />
            <Text style={styles.priceText}>₹{item.price || "0"}</Text>
          </View>
        </View>

        {/* Action buttons for service providers (pending bookings) */}
        {(userRole === "admin" || userRole === "shopkeeper") && item.status === "pending" && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleUpdateBookingStatus(item.id, "confirmed")}
            >
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleUpdateBookingStatus(item.id, "rejected")}
            >
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action buttons for service providers (confirmed bookings) */}
        {(userRole === "admin" || userRole === "shopkeeper") && item.status === "confirmed" && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleUpdateBookingStatus(item.id, "completed")}
            >
              <Text style={styles.actionButtonText}>Mark Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleUpdateBookingStatus(item.id, "cancelled")}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (bookingsLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
        <Text style={styles.headerSubtitle}>Manage your bookings</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            statusFilter === "all" && styles.filterBtnActive,
          ]}
          onPress={() => setStatusFilter("all")}
        >
          <Text
            style={[
              styles.filterBtnText,
              statusFilter === "all" && styles.filterBtnTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            statusFilter === "pending" && styles.filterBtnActive,
          ]}
          onPress={() => setStatusFilter("pending")}
        >
          <Text
            style={[
              styles.filterBtnText,
              statusFilter === "pending" && styles.filterBtnTextActive,
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            statusFilter === "confirmed" && styles.filterBtnActive,
          ]}
          onPress={() => setStatusFilter("confirmed")}
        >
          <Text
            style={[
              styles.filterBtnText,
              statusFilter === "confirmed" && styles.filterBtnTextActive,
            ]}
          >
            Confirmed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            statusFilter === "completed" && styles.filterBtnActive,
          ]}
          onPress={() => setStatusFilter("completed")}
        >
          <Text
            style={[
              styles.filterBtnText,
              statusFilter === "completed" && styles.filterBtnTextActive,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            statusFilter === "cancelled" && styles.filterBtnActive,
          ]}
          onPress={() => setStatusFilter("cancelled")}
        >
          <Text
            style={[
              styles.filterBtnText,
              statusFilter === "cancelled" && styles.filterBtnTextActive,
            ]}
          >
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {filteredBookings.length > 0 ? (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No bookings found</Text>
          <Text style={styles.emptySubtext}>
            {statusFilter === "all" 
              ? (userRole === "admin" || userRole === "shopkeeper" ? "Customer bookings will appear here" : "Your bookings will appear here")
              : `No ${statusFilter} bookings`
            }
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterBtnTextActive: {
    color: "#ffffff",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bookingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: "#64748b",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4f46e5",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#dcfce7",
  },
  rejectButton: {
    backgroundColor: "#fee2e2",
  },
  completeButton: {
    backgroundColor: "#dbeafe",
  },
  cancelButton: {
    backgroundColor: "#fef3c7",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
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
  fetchShopkeeperBookings,
  selectBookingsLoading,
  selectShopkeeperBookings,
} from "../../store/slices/bookingsSlice";
import {
  fetchShopServices,
  selectShopServices,
} from "../../store/slices/servicesSlice";
import TypographyComponents from "../Components/TypographyComponents";
import { auth, db } from "../services/firebaseconfig";

export default function AdminHomeScreen({ userData }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { userRole, loading: roleLoading } = useUserRole();
  const { uid } = useSelector(selectAuth);
  const [shopData, setShopData] = useState(userData);
  const [loading, setLoading] = useState(true);

  const bookings = useSelector(selectShopkeeperBookings);
  const services = useSelector(selectShopServices);
  const bookingsLoading = useSelector(selectBookingsLoading);

  useEffect(() => {
    // Only redirect if role is loaded and not admin/shopkeeper
    if (
      !roleLoading &&
      userRole &&
      userRole !== "admin" &&
      userRole !== "shopkeeper"
    ) {
      router.replace("/(user)/home");
    }
  }, [userRole, roleLoading]);

  useEffect(() => {
    const fetchShopData = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            setShopData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching shop data:", error);
        }
      }
      setLoading(false);
    };
    fetchShopData();
  }, []);

  // Fetch bookings and services from Redux
  useEffect(() => {
    if (uid) {
      dispatch(fetchShopkeeperBookings(uid));
      dispatch(fetchShopServices(uid));
    }
  }, [uid, dispatch]);

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

  // Calculate stats
  const totalBookings = bookings.length;
  const activeServices = services.length;
  const acceptedBookings = bookings.filter(
    (b) => b.status === "accepted",
  ).length;
  const completedBookings = bookings.filter(
    (b) => b.status === "completed",
  ).length;

  // Get pending bookings (incoming requests)
  const pendingBookings = bookings.filter((b) => b.status === "pending");

  // Handle Accept Booking
  const handleAcceptBooking = async (bookingId) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: "accepted",
        acceptedAt: new Date(),
      });
      // Refresh bookings
      if (uid) {
        dispatch(fetchShopkeeperBookings(uid));
      }
      Alert.alert("Success", "Booking accepted!");
    } catch (error) {
      console.error("Error accepting booking:", error);
      Alert.alert("Error", "Failed to accept booking");
    }
  };

  // Handle Reject Booking
  const handleRejectBooking = async (bookingId) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: "rejected",
        rejectedAt: new Date(),
      });
      // Refresh bookings
      if (uid) {
        dispatch(fetchShopkeeperBookings(uid));
      }
      Alert.alert("Success", "Booking rejected");
    } catch (error) {
      console.error("Error rejecting booking:", error);
      Alert.alert("Error", "Failed to reject booking");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <TypographyComponents size="2xl" font="bold" color="#1f2937">
            Dashboard
          </TypographyComponents>
          <TypographyComponents
            size="md"
            font="reg"
            color="#6b7280"
            style={styles.welcomeSubtitle}
          >
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
                  {shopData.shopName || "My Shop"}
                </TypographyComponents>
                <TypographyComponents size="sm" font="reg" color="#6b7280">
                  {shopData.ownerName || "Owner"}
                </TypographyComponents>
              </View>
            </View>

            {shopData.location?.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color="#6b7280" />
                <TypographyComponents
                  size="sm"
                  font="reg"
                  color="#1f2937"
                  style={styles.infoText}
                >
                  {shopData.location.address}
                </TypographyComponents>
              </View>
            )}

            {shopData.category && (
              <View style={styles.infoRow}>
                <Ionicons name="pricetag" size={16} color="#6b7280" />
                <TypographyComponents
                  size="sm"
                  font="reg"
                  color="#1f2937"
                  style={styles.infoText}
                >
                  {shopData.category}
                </TypographyComponents>
              </View>
            )}

            {shopData.openingTime && shopData.closingTime && (
              <View style={styles.infoRow}>
                <Ionicons name="time" size={16} color="#6b7280" />
                <TypographyComponents
                  size="sm"
                  font="reg"
                  color="#1f2937"
                  style={styles.infoText}
                >
                  {shopData.openingTime} - {shopData.closingTime}
                </TypographyComponents>
              </View>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <TypographyComponents
            size="lg"
            font="medium"
            color="#1f2937"
            style={styles.sectionTitle}
          >
            Quick Actions
          </TypographyComponents>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/(tabs)/services")}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="construct" size={24} color="#6366f1" />
              </View>
              <TypographyComponents
                size="md"
                font="medium"
                color="#1f2937"
                style={styles.actionTitle}
              >
                Manage Services
              </TypographyComponents>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/(tabs)/notifications")}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="notifications" size={24} color="#6366f1" />
              </View>
              <TypographyComponents
                size="md"
                font="medium"
                color="#1f2937"
                style={styles.actionTitle}
              >
                Notifications
              </TypographyComponents>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/(tabs)/profile")}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="settings" size={24} color="#6366f1" />
              </View>
              <TypographyComponents
                size="md"
                font="medium"
                color="#1f2937"
                style={styles.actionTitle}
              >
                Edit Profile
              </TypographyComponents>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TypographyComponents
              size="2xl"
              font="bold"
              color="#6366f1"
              style={styles.statNumber}
            >
              {totalBookings}
            </TypographyComponents>
            <TypographyComponents
              size="xs"
              font="reg"
              color="#6b7280"
              style={styles.statLabel}
            >
              Total Bookings
            </TypographyComponents>
          </View>
          <View style={styles.statCard}>
            <TypographyComponents
              size="2xl"
              font="bold"
              color="#10b981"
              style={styles.statNumber}
            >
              {completedBookings}
            </TypographyComponents>
            <TypographyComponents
              size="xs"
              font="reg"
              color="#6b7280"
              style={styles.statLabel}
            >
              Completed
            </TypographyComponents>
          </View>
          <View style={styles.statCard}>
            <TypographyComponents
              size="2xl"
              font="bold"
              color="#f59e0b"
              style={styles.statNumber}
            >
              {acceptedBookings}
            </TypographyComponents>
            <TypographyComponents
              size="xs"
              font="reg"
              color="#6b7280"
              style={styles.statLabel}
            >
              Active
            </TypographyComponents>
          </View>
        </View>

        {/* Incoming Booking Requests */}
        {pendingBookings.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <TypographyComponents size="lg" font="medium" color="#1f2937">
                Booking Requests
              </TypographyComponents>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingBookings.length}</Text>
              </View>
            </View>

            {pendingBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingRequestCard}>
                <View style={styles.requestHeader}>
                  <View>
                    <Text style={styles.serviceNameBold}>
                      {booking.serviceName}
                    </Text>
                    <Text style={styles.customerName}>{booking.userName}</Text>
                  </View>
                  <View style={styles.dateTimeBadge}>
                    <Ionicons name="calendar" size={14} color="#f59e0b" />
                    <Text style={styles.dateTimeText}>
                      {booking.bookingDate}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestDivider} />

                <View style={styles.requestDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>{booking.bookingTime}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="cash" size={16} color="#4f46e5" />
                    <Text style={styles.detailPrice}>₹{booking.price}</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleRejectBooking(booking.id)}
                  >
                    <Ionicons name="close" size={18} color="#ef4444" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAcceptBooking(booking.id)}
                  >
                    <Ionicons name="checkmark" size={18} color="#10b981" />
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  welcomeSection: {
    marginBottom: 24,
  },
  shopCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  shopIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  shopIcon: {
    fontSize: 30,
  },
  shopInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    marginTop: 12,
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: "#1f2937",
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6366f1",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingVertical: 12,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  actionTitle: {
    textAlign: "center",
  },

  statNumber: {
    textAlign: "center",
  },

  // Booking Request Card Styles
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "#f59e0b",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  bookingRequestCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  serviceNameBold: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  customerName: {
    fontSize: 13,
    color: "#6b7280",
  },
  dateTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateTimeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400e",
  },
  requestDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  requestDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  detailPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4f46e5",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    gap: 6,
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ef4444",
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#dcfce7",
    gap: 6,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10b981",
  },
});

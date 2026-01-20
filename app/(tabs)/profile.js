import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useUserRole } from "../../hooks/useUserRole";
import { selectAuth } from "../../store";
import LogoutButton from "../Components/LogoutButton";
import { db } from "../services/firebaseconfig";

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { userData, userRole } = useUserRole();
  const { uid } = useSelector(selectAuth);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalShops: 0,
    totalBookings: 0,
    recentActivity: []
  });
  const [editedData, setEditedData] = useState({
    shopName: "",
    ownerName: "",
    shopPhone: "",
    email: "",
    address: "",
  });

  const isAdmin = userRole === 'admin' || userRole === 'super-admin';
  const isShopkeeper = userRole === 'shopkeeper';

  useEffect(() => {
    if (userData) {
      if (isShopkeeper || isAdmin) {
        // For shopkeepers/admins - show shop related fields
        setEditedData({
          shopName: userData.shopName || "",
          ownerName: userData.ownerName || userData.fullName || "",
          shopPhone: userData.shopPhone || userData.phone || "",
          email: userData.email || "",
          address: userData.address || "",
        });
      } else {
        // For regular users - show only personal fields
        setEditedData({
          shopName: "", // No shop name for users
          ownerName: userData.fullName || "",
          shopPhone: userData.phone || "",
          email: userData.email || "",
          address: userData.address || "",
        });
      }
    }
  }, [userData, isShopkeeper, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminStats();
    }
  }, [isAdmin]);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      
      // Fetch total users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const totalUsers = usersSnapshot.size;
      
      // Fetch total shops (admin/shopkeeper users)
      const shopsQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['admin', 'shopkeeper'])
      );
      const shopsSnapshot = await getDocs(shopsQuery);
      const totalShops = shopsSnapshot.size;
      
      // Fetch total bookings
      const bookingsQuery = query(collection(db, 'bookings'));
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const totalBookings = bookingsSnapshot.size;
      
      // Fetch recent activity (last 10 bookings)
      const recentBookingsQuery = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc')
      );
      const recentBookingsSnapshot = await getDocs(recentBookingsQuery);
      const recentActivity = [];
      
      recentBookingsSnapshot.docs.slice(0, 10).forEach(doc => {
        const data = doc.data();
        recentActivity.push({
          id: doc.id,
          type: 'booking',
          description: `${data.userName} booked ${data.serviceName}`,
          timestamp: data.createdAt?.toDate() || new Date(),
          status: data.status
        });
      });
      
      setAdminStats({
        totalUsers,
        totalShops,
        totalBookings,
        recentActivity
      });
      
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      if (uid) {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, {
          shopName: editedData.shopName,
          ownerName: editedData.ownerName,
          shopPhone: editedData.shopPhone,
          email: editedData.email,
          address: editedData.address,
        });
        
        Alert.alert('Success', 'Profile updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      // If cancelling, revert changes
      if (userData) {
        setEditedData({
          shopName: userData.shopName || "",
          ownerName: userData.ownerName || userData.fullName || "",
          shopPhone: userData.shopPhone || userData.phone || "",
          email: userData.email || "",
          address: userData.address || "",
        });
      }
    }
    setIsEditing(!isEditing);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>
              {isAdmin ? 'Admin Dashboard & Account' : isShopkeeper ? 'Shop & Account Information' : 'Account Information'}
            </Text>
          </View>
          <LogoutButton variant="icon" />
        </View>

        {/* Admin Credentials Card */}
        {isAdmin && (
          <View style={styles.adminCard}>
            <View style={styles.adminHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#10b981" />
              <Text style={styles.adminTitle}>Admin Access</Text>
            </View>
            <View style={styles.credentialsContainer}>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Username:</Text>
                <Text style={styles.credentialValue}>admin</Text>
              </View>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Password:</Text>
                <Text style={styles.credentialValue}>pass@123</Text>
              </View>
            </View>
          </View>
        )}

        {/* Admin Stats Dashboard */}
        {isAdmin && (
          <View style={styles.sectionCard}>
            <View style={styles.statsHeader}>
              <Text style={styles.sectionTitle}>Platform Overview</Text>
              <TouchableOpacity onPress={fetchAdminStats} disabled={loading}>
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color={loading ? "#9ca3af" : "#4f46e5"} 
                />
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4f46e5" />
                <Text style={styles.loadingText}>Loading stats...</Text>
              </View>
            ) : (
              <>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{adminStats.totalUsers}</Text>
                    <Text style={styles.statLabel}>Total Users</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{adminStats.totalShops}</Text>
                    <Text style={styles.statLabel}>Active Shops</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{adminStats.totalBookings}</Text>
                    <Text style={styles.statLabel}>Total Bookings</Text>
                  </View>
                </View>
                
                {/* Recent Activity */}
                <View style={styles.activitySection}>
                  <Text style={styles.activityTitle}>Recent Activity</Text>
                  {adminStats.recentActivity.length > 0 ? (
                    adminStats.recentActivity.slice(0, 5).map((activity, index) => (
                      <View key={index} style={styles.activityItem}>
                        <View style={styles.activityIcon}>
                          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                        </View>
                        <View style={styles.activityContent}>
                          <Text style={styles.activityDescription} numberOfLines={1}>
                            {activity.description}
                          </Text>
                          <Text style={styles.activityTime}>
                            {activity.timestamp ? 
                              `${activity.timestamp.toLocaleDateString()} ${activity.timestamp.toLocaleTimeString()}` 
                              : 'Date not available'
                            }
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, 
                          activity.status === 'accepted' ? styles.acceptedBadge :
                          activity.status === 'pending' ? styles.pendingBadge : styles.completedBadge
                        ]}>
                          <Text style={styles.statusText}>{activity.status}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noActivityText}>No recent activity</Text>
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {isShopkeeper || isAdmin 
                  ? (editedData.shopName || editedData.ownerName || 'SP')[0]
                  : (editedData.ownerName || 'U')[0]
                }
              </Text>
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.shopName}>
              {isShopkeeper || isAdmin 
                ? (editedData.shopName || 'Shop Name')
                : (editedData.ownerName || 'User Name')
              }
            </Text>
            <Text style={styles.ownerName}>
              {isShopkeeper || isAdmin 
                ? (editedData.ownerName || 'Owner Name')
                : (userRole || 'Customer')
              }
            </Text>
            
            <TouchableOpacity style={styles.editButton} onPress={toggleEdit}>
              <Ionicons name={isEditing ? 'checkmark' : 'pencil'} size={16} color="#ffffff" />
              <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {isShopkeeper || isAdmin ? 'Shop & Contact Information' : 'Personal Information'}
          </Text>

          {/* Shop Name - Only for shopkeepers/admins */}
          {(isShopkeeper || isAdmin) && (
            <>
              <View style={styles.infoField}>
                <View style={styles.fieldIconContainer}>
                  <Ionicons name="storefront-outline" size={20} color="#4f46e5" />
                </View>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    placeholder="Shop Name"
                    value={editedData.shopName}
                    onChangeText={(text) => setEditedData({...editedData, shopName: text})}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{editedData.shopName || 'Not set'}</Text>
                )}
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Owner/User Name */}
          <View style={styles.infoField}>
            <View style={styles.fieldIconContainer}>
              <Ionicons name="person-outline" size={20} color="#4f46e5" />
            </View>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                placeholder={isShopkeeper || isAdmin ? "Owner Name" : "Full Name"}
                value={editedData.ownerName}
                onChangeText={(text) => setEditedData({...editedData, ownerName: text})}
              />
            ) : (
              <Text style={styles.fieldValue}>{editedData.ownerName || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.infoField}>
            <View style={styles.fieldIconContainer}>
              <Ionicons name="call-outline" size={20} color="#4f46e5" />
            </View>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                placeholder="Phone Number"
                value={editedData.shopPhone}
                onChangeText={(text) => setEditedData({...editedData, shopPhone: text})}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>{editedData.shopPhone || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.infoField}>
            <View style={styles.fieldIconContainer}>
              <Ionicons name="mail-outline" size={20} color="#4f46e5" />
            </View>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                placeholder="Email Address"
                value={editedData.email}
                onChangeText={(text) => setEditedData({...editedData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.fieldValue}>{editedData.email || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.infoField}>
            <View style={styles.fieldIconContainer}>
              <Ionicons name="location-outline" size={20} color="#4f46e5" />
            </View>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                placeholder="Address"
                value={editedData.address}
                onChangeText={(text) => setEditedData({...editedData, address: text})}
              />
            ) : (
              <Text style={styles.fieldValue}>{editedData.address || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications-outline" size={20} color="#6b7280" />
            </View>
            <Text style={styles.settingText}>Notification Settings</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#d1d5db"
              style={styles.chevron}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="help-circle-outline" size={20} color="#6b7280" />
            </View>
            <Text style={styles.settingText}>Help & Support</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#d1d5db"
              style={styles.chevron}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
            </View>
            <Text style={styles.settingText}>About Us</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#d1d5db"
              style={styles.chevron}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed Logout Button at Bottom */}
      <View style={styles.fixedFooter}>
        <LogoutButton />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    paddingBottom: 100, // Add extra padding at bottom to ensure logout button is visible
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerLogoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4f46e5",
  },
  profileInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4f46e5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  infoField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  fieldIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
  },
  editInput: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: -16,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  chevron: {
    marginLeft: 8,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fixedFooter: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  
  // Admin-specific styles
  adminCard: {
    backgroundColor: "#f0fdf4",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  adminHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#065f46",
  },
  credentialsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
  },
  credentialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  credentialLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  credentialValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
    fontFamily: "monospace",
  },
  
  // Stats styles
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  
  // Activity styles
  activitySection: {
    marginTop: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: "#334155",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#64748b",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  acceptedBadge: {
    backgroundColor: "#dcfce7",
  },
  pendingBadge: {
    backgroundColor: "#fef3c7",
  },
  completedBadge: {
    backgroundColor: "#dbeafe",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  noActivityText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 20,
  },
});

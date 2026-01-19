import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useUserRole } from "../../hooks/useUserRole";
import { selectAuth } from "../../store";
import { clearAuth } from "../../store/slices/authSlice";
import { clearAuthData } from "../../utils/authStorage";
import { db } from "../services/firebaseconfig";

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { userData, userRole } = useUserRole();
  const { uid } = useSelector(selectAuth);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    shopName: "",
    ownerName: "",
    shopPhone: "",
    email: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      setEditedData({
        shopName: userData.shopName || "",
        ownerName: userData.ownerName || userData.fullName || "",
        shopPhone: userData.shopPhone || userData.phone || "",
        email: userData.email || "",
        address: userData.address || "",
      });
    }
  }, [userData]);

  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            setLoggingOut(true);
            const auth = getAuth();
            await signOut(auth);
            await clearAuthData();
            dispatch(clearAuth());
            router.replace("/auth/login");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
            setLoggingOut(false);
          }
        },
      },
    ]);
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Shop & Account Information</Text>
        </View>

        {/* Shop Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{(editedData.shopName || editedData.ownerName || 'SP')[0]}</Text>
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.shopName}>{editedData.shopName || 'Shop Name'}</Text>
            <Text style={styles.ownerName}>{editedData.ownerName || 'Owner Name'}</Text>
            
            <TouchableOpacity style={styles.editButton} onPress={toggleEdit}>
              <Ionicons name={isEditing ? 'checkmark' : 'pencil'} size={16} color="#ffffff" />
              <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

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

          <View style={styles.infoField}>
            <View style={styles.fieldIconContainer}>
              <Ionicons name="person-outline" size={20} color="#4f46e5" />
            </View>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                placeholder="Owner Name"
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

        {/* Logout Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
            <Text style={styles.logoutText}>
              {loggingOut ? "Logging out..." : "Logout"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
});

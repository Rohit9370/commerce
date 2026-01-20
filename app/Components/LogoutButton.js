import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useDispatch } from "react-redux";
import { clearAuth } from "../../store/slices/authSlice";
import { clearAllAuthData } from "../../utils/authStorage";

const LogoutButton = ({ style, variant = "full" }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loggingOut, setLoggingOut] = useState(false);

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
            
         
            await clearAllAuthData();
            
          
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

  if (variant === "icon") {
    return (
      <TouchableOpacity
        style={[styles.iconButton, style]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.fullButton, style]}
      onPress={handleLogout}
      disabled={loggingOut}
    >
      <Ionicons name="log-out-outline" size={20} color="#ffffff" />
      <Text style={styles.buttonText}>
        {loggingOut ? "Logging out..." : "Logout"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  fullButton: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
});

export default LogoutButton;
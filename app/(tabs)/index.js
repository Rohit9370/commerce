import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminHomeScreen from "../(admin)/home";
import SuperAdminHomeScreen from "../(super-admin)/home";
import UserHomeScreen from "../(user)/home";
import { useUserRole } from "../../hooks/useUserRole";

export default function HomeScreen() {
  const { userRole, userData, loading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (userRole === "super-admin") {
    return <SuperAdminHomeScreen />;
  }

  if (userRole === "admin" || userRole === "shopkeeper") {
    return <AdminHomeScreen userData={userData} />;
  }

  // default: normal user
  return <UserHomeScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
});

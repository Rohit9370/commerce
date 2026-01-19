import { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
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
  fetchAllServices,
  fetchShopServices,
  selectAllServices,
  selectServicesLoading,
  selectShopServices,
} from "../../store/slices/servicesSlice";
import TypographyComponents from "../Components/TypographyComponents";
import AdminServicesScreen from "./_admin-services";

export default function ServicesScreen() {
  const { userRole } = useUserRole();
  const dispatch = useDispatch();
  const { uid } = useSelector(selectAuth);
  const loading = useSelector(selectServicesLoading);

  // For users: show all available services
  const allServices = useSelector(selectAllServices);

  // For shopkeepers/admins: show their own services
  const shopServices = useSelector(selectShopServices);

  const displayServices = userRole === "user" ? allServices : shopServices;

  useEffect(() => {
    if (userRole === "user" || userRole === "guest") {
      dispatch(fetchAllServices());
    } else if (userRole === "shopkeeper" || userRole === "admin") {
      if (uid) {
        dispatch(fetchShopServices(uid));
      }
    }
  }, [userRole, uid, dispatch]);

  if (userRole === "admin" || userRole === "super-admin") {
    return <AdminServicesScreen />;
  }

  if (userRole === "shopkeeper" && !loading && displayServices.length === 0) {
    return <AdminServicesScreen />;
  }

  const renderService = ({ item }) => (
    <TouchableOpacity style={styles.serviceCard}>
      <View style={styles.serviceRow}>
        <View style={styles.serviceIconPlaceholder}>
          {item.icon ? (
            <Text style={styles.iconText}>{item.icon}</Text>
          ) : (
            <Text style={styles.iconText}>🔧</Text>
          )}
        </View>
        <View style={styles.serviceDetails}>
          <TypographyComponents size="lg" font="bold" other="text-gray-800">
            {item.name}
          </TypographyComponents>
          <TypographyComponents size="sm" font="reg" other="text-gray-600">
            {item.description || "Professional service"}
          </TypographyComponents>
          <View style={styles.serviceMeta}>
            <TypographyComponents size="md" font="bold" other="text-indigo-600">
              ${item.price || "Contact"}/hr
            </TypographyComponents>
            {item.rating && (
              <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TypographyComponents size="2xl" font="bold" other="text-gray-800">
          {userRole === "shopkeeper" ? "My Services" : "Available Services"}
        </TypographyComponents>
        <TypographyComponents size="md" font="reg" other="text-gray-600 mt-1">
          {userRole === "shopkeeper"
            ? "Manage your services"
            : `Browse ${displayServices.length} services`}
        </TypographyComponents>
      </View>
      <FlatList
        data={displayServices}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No services available</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
  },
  serviceCard: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceIconPlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  iconText: {
    fontSize: 32,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  rating: {
    color: "#f59e0b",
    fontSize: 14,
    fontWeight: "500",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "500",
  },
});

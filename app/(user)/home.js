import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserRole } from "../../hooks/useUserRole";
import { db } from "../services/firebaseconfig";

const { width, height } = Dimensions.get("window");

export default function UserHomeScreen() {
  const router = useRouter();
  const { userData, loading: roleLoading } = useUserRole();
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  const listRef = useRef(null);

  const DEFAULT_REGION = {
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const [hasFitted, setHasFitted] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const radiusOptions = [2, 5, 10, 20];

  // Tab navigation state
  const [activeTab, setActiveTab] = useState("home");

  // Update active tab based on route
  useEffect(() => {
    // Set active tab to 'home' since we're in the home component
    setActiveTab("home");
  }, []);

  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const fetchShops = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "in", ["admin", "shopkeeper"]),
      );
      const querySnapshot = await getDocs(q);
      const shopsData = querySnapshot.docs.map((d) => {
        const data = d.data();
        const loc = data.location || {};
        const lat = parseFloat(loc.latitude);
        const lon = parseFloat(loc.longitude);
        return {
          id: d.id,
          ...data,
          location:
            isFinite(lat) && isFinite(lon)
              ? { latitude: lat, longitude: lon }
              : null,
        };
      });
      setShops(shopsData);
      setFilteredShops(shopsData);
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    } catch (e) {
      console.warn("Location error", e);
    }
  };

  useEffect(() => {
    requestLocation().finally(fetchShops);
  }, []);

  const applyFilters = useMemo(() => {
    const q = (searchQuery || "").toLowerCase();
    return shops.filter((shop) => {
      const matches =
        shop.shopName?.toLowerCase().includes(q) ||
        shop.category?.toLowerCase().includes(q);
      if (!matches) return false;
      if (userLocation && shop.location) {
        const d = haversineKm(
          userLocation.latitude,
          userLocation.longitude,
          shop.location.latitude,
          shop.location.longitude,
        );
        return d <= radiusKm;
      }
      return true;
    });
  }, [shops, searchQuery, userLocation, radiusKm]);

  useEffect(() => {
    setFilteredShops(applyFilters);
  }, [applyFilters]);

  useEffect(() => {
    const coords = filteredShops
      .filter((s) => s.location)
      .map((s) => s.location);
    if (mapRef.current && coords.length > 0 && !hasFitted) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 150, right: 50, bottom: 250, left: 50 },
        animated: true,
      });
      setHasFitted(true);
    }
  }, [filteredShops, hasFitted]);

  useEffect(() => {
    setHasFitted(false);
  }, [searchQuery, radiusKm]);

  const isOpenNow = (shop) => {
    const t = shop?.timing;
    if (!t || !t.open || !t.close) return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const parse = (s) => {
      const m = s.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (!m) return 0;
      let h = parseInt(m[1]),
        min = parseInt(m[2]),
        p = m[3].toUpperCase();
      if (p === "PM" && h !== 12) h += 12;
      if (p === "AM" && h === 12) h = 0;
      return h * 60 + min;
    };
    const open = parse(t.open),
      close = parse(t.close);
    return close >= open
      ? cur >= open && cur <= close
      : cur >= open || cur <= close;
  };

  if (roleLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading shops...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* MAP VIEW */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={
          userLocation ? { ...DEFAULT_REGION, ...userLocation } : DEFAULT_REGION
        }
        showsUserLocation
        showsMyLocationButton={false}
      >
        {filteredShops.map(
          (shop) =>
            shop.location && (
              <Marker
                key={shop.id}
                coordinate={shop.location}
                onPress={() => router.push(`/services/${shop.id}`)}
              >
                <View style={styles.customMarker}>
                  <View
                    style={[
                      styles.markerLabel,
                      { borderColor: isOpenNow(shop) ? "#10B981" : "#EF4444" },
                    ]}
                  >
                    <Text style={styles.markerText} numberOfLines={1}>
                      {shop.shopName}
                    </Text>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: isOpenNow(shop)
                            ? "#10B981"
                            : "#EF4444",
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.markerPointer} />
                </View>
              </Marker>
            ),
        )}
      </MapView>

      {/* FLOATING HEADER */}
      <View style={styles.floatingHeader}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeText}>
                Hi, {userData?.fullName?.split(" ")[0] || "User"}!
              </Text>
              <Text style={styles.subText}>Services near you</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#1F2937"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.searchBox}>
            <Ionicons
              name="search"
              size={18}
              color="#9CA3AF"
              style={{ marginLeft: 12 }}
            />
            <TextInput
              placeholder="Search services..."
              style={styles.input}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.chipRow}>
            {radiusOptions.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRadiusKm(r)}
                style={[styles.chip, radiusKm === r && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    radiusKm === r && styles.chipTextActive,
                  ]}
                >
                  {r}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* BOTTOM SHOP CARDS */}
      <View style={styles.bottomListContainer}>
        <FlatList
          ref={listRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filteredShops}
          keyExtractor={(item) => item.id}
          snapToInterval={width * 0.8 + 16}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.shopCard}
              onPress={() => router.push(`/services/${item.id}`)}
            >
              <Image
                source={
                  item.shopImages?.[0] ? { uri: item.shopImages[0] } : null
                }
                style={styles.cardImg}
                contentFit="cover"
              />
              <View style={styles.cardInfo}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.shopName}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isOpenNow(item)
                          ? "#DCFCE7"
                          : "#FEE2E2",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: isOpenNow(item) ? "#166534" : "#991B1B" },
                      ]}
                    >
                      {isOpenNow(item) ? "OPEN" : "CLOSED"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardCategory}>
                  {item.category || "Service"}
                </Text>
                <View style={styles.cardFooter}>
                  <Ionicons name="location" size={14} color="#4F46E5" />
                  <Text style={styles.distanceText}>
                    {userLocation
                      ? `${haversineKm(userLocation.latitude, userLocation.longitude, item.location.latitude, item.location.longitude).toFixed(1)} km away`
                      : "--"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* LOCATE ME FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          userLocation &&
          mapRef.current?.animateToRegion(
            { ...DEFAULT_REGION, ...userLocation },
            400,
          )
        }
      >
        <Ionicons name="navigate" size={22} color="white" />
      </TouchableOpacity>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab("home");
            router.push("/(user)/home");
          }}
        >
          <Ionicons
            name={activeTab === "home" ? "home" : "home-outline"}
            size={24}
            color={activeTab === "home" ? "#4F46E5" : "#9CA3AF"}
          />
          <Text
            style={
              activeTab === "home" ? styles.tabText : styles.tabTextInactive
            }
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab("bookings");
            router.push("/(tabs)/bookings");
          }}
        >
          <Ionicons
            name={activeTab === "bookings" ? "calendar" : "calendar-outline"}
            size={24}
            color={activeTab === "bookings" ? "#4F46E5" : "#9CA3AF"}
          />
          <Text
            style={
              activeTab === "bookings" ? styles.tabText : styles.tabTextInactive
            }
          >
            Bookings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab("profile");
            router.push("/(tabs)/profile");
          }}
        >
          <Ionicons
            name={activeTab === "profile" ? "person" : "person-outline"}
            size={24}
            color={activeTab === "profile" ? "#4F46E5" : "#9CA3AF"}
          />
          <Text
            style={
              activeTab === "profile" ? styles.tabText : styles.tabTextInactive
            }
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: { ...StyleSheet.absoluteFillObject },
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
  },

  // Floating Header
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
  },
  headerCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  welcomeText: { fontSize: 20, fontWeight: "800", color: "#111827" },
  subText: { fontSize: 13, color: "#6B7280" },
  iconBtn: { padding: 8, backgroundColor: "#F3F4F6", borderRadius: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 15,
    height: 45,
  },
  input: { flex: 1, paddingHorizontal: 10, fontWeight: "600", fontSize: 14 },
  chipRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: { backgroundColor: "#111827", borderColor: "#111827" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  chipTextActive: { color: "#fff" },

  // Markers
  customMarker: { alignItems: "center" },
  markerLabel: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    elevation: 4,
  },
  markerText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1F2937",
    marginRight: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  markerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "white",
    marginTop: -1,
  },

  // Bottom List
  bottomListContainer: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    maxHeight: height * 0.4,
  },
  shopCard: {
    width: width * 0.8,
    backgroundColor: "white",
    borderRadius: 24,
    marginRight: 16,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  cardImg: { width: "100%", height: 120, backgroundColor: "#E5E7EB" },
  cardInfo: { padding: 15 },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: "800" },
  cardCategory: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 4,
  },
  distanceText: { fontSize: 13, fontWeight: "700", color: "#4F46E5" },

  // FAB
  fab: {
    position: "absolute",
    bottom: 140,
    right: 20,
    backgroundColor: "#4F46E5",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
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
    zIndex: 20,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
    marginTop: 4,
  },
  tabTextInactive: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    marginTop: 4,
  },
});

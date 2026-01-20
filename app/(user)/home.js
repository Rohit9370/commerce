import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserRole } from "../../hooks/useUserRole";
import { db } from "../services/firebaseconfig";

const { width, height } = Dimensions.get("window");

export default function UserHomeScreen() {
  const router = useRouter();
  const { userData, userRole, loading: roleLoading } = useUserRole();
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const mapRef = useRef(null);
  const listRef = useRef(null);

  const DEFAULT_REGION = {
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const [hasFitted, setHasFitted] = useState(false);
  const [radiusKm, setRadiusKm] = useState(1000); // Start with "All" to show all shops
  const radiusOptions = [2, 5, 10, 20];

  // Authentication guard
  useEffect(() => {
    if (!roleLoading) {
      if (!userData?.uid) {
        console.log('UserHomeScreen - No user data, redirecting to login');
        router.replace('/auth/login');
        return;
      }
      
      if (userRole && userRole !== 'user') {
        console.log('UserHomeScreen - Wrong role:', userRole, 'redirecting');
        if (userRole === 'admin' || userRole === 'shopkeeper') {
          router.replace('/(tabs)/_admin-home');
        } else if (userRole === 'super-admin') {
          router.replace('/(tabs)/_super-admin-home');
        }
        return;
      }
    }
  }, [roleLoading, userData, userRole, router]);

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
    // Prevent multiple simultaneous location requests
    if (locationLoading) {
      console.log('Location request already in progress...');
      return;
    }

    try {
      setLocationLoading(true);
      console.log('Requesting location permission...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== "granted") {
        console.log('Location permission denied');
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to see nearby services and distances.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return;
      }

      console.log('Getting current position...');
      
      // First try with high accuracy
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 10000,
          maximumAge: 60000, // Accept cached location up to 1 minute old
        });
        
        const newLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        
        console.log('Location obtained:', newLocation);
        setUserLocation(newLocation);
        
        // Animate map to user location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...newLocation,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 1000);
        }
        
      } catch (highAccuracyError) {
        console.log('High accuracy failed, trying with lower accuracy...');
        
        // Fallback to lower accuracy
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
          timeout: 15000,
          maximumAge: 300000, // Accept cached location up to 5 minutes old
        });
        
        const newLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        
        console.log('Location obtained with low accuracy:', newLocation);
        setUserLocation(newLocation);
        
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...newLocation,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }, 1000);
        }
      }
      
    } catch (e) {
      console.error("Location error:", e);
      Alert.alert(
        'Location Unavailable',
        'Unable to get your location. Please:\n\n1. Enable Location Services in device settings\n2. Make sure GPS is turned on\n3. Try again in a few moments',
        [
          { text: 'Use Default Location', onPress: () => {
            // Set default location to Delhi/Gadge Nagar area
            const defaultLocation = {
              latitude: 28.6139,
              longitude: 77.209,
            };
            setUserLocation(defaultLocation);
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                ...defaultLocation,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }, 1000);
            }
          }},
          { text: 'Try Again', onPress: requestLocation }
        ]
      );
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    // Only initialize once when component mounts
    const initializeApp = async () => {
      if (!userLocation && !locationLoading) {
        await requestLocation();
      }
      await fetchShops();
    };
    
    initializeApp();
  }, []); // Empty dependency array to run only once

  const applyFilters = useMemo(() => {
    const q = (searchQuery || "").toLowerCase();
    let filtered = shops.filter((shop) => {
      const matches =
        shop.shopName?.toLowerCase().includes(q) ||
        shop.category?.toLowerCase().includes(q);
      return matches;
    });

    if (userLocation) {
      filtered = filtered.map(shop => {
        if (shop.location && 
            typeof shop.location.latitude === 'number' && 
            typeof shop.location.longitude === 'number' &&
            isFinite(shop.location.latitude) && 
            isFinite(shop.location.longitude)) {
          try {
            const distance = haversineKm(
              userLocation.latitude,
              userLocation.longitude,
              shop.location.latitude,
              shop.location.longitude,
            );
            return { ...shop, distance: isFinite(distance) ? distance : null };
          } catch (error) {
            console.warn('Distance calculation error:', error);
            return { ...shop, distance: null };
          }
        }
        return { ...shop, distance: null };
      });
      if (radiusKm !== 1000) {
        filtered = filtered.filter(shop => 
          shop.distance === null || shop.distance <= radiusKm
        );
      }
      filtered.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    return filtered;
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
    if (!t) return false;
    
    // Check for 24 hours operation
    if (t.isOpen24Hours || 
        t.open === '24 Hours' || 
        t.close === '24 Hours') {
      return true;
    }
    
    if (!t.open || !t.close) return false;
    
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const parse = (s) => {
      if (!s || s === '24 Hours') return 0;
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
    
    // If both times are 0 (couldn't parse), assume closed
    if (open === 0 && close === 0) return false;
    
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
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Custom User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner}>
                <Ionicons name="person" size={16} color="white" />
              </View>
              <View style={styles.userMarkerPulse} />
            </View>
          </Marker>
        )}

        {/* Shop Markers */}
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

      {/* FLOATING HEADER - Moved down */}
      <View style={styles.floatingHeader}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeText}>
                Hi, {userData?.fullName?.split(" ")[0] || "User"}!
              </Text>
              <Text style={styles.subText}>
                {userLocation ? 'Services near you' : 'Enable location for nearby services'}
              </Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={requestLocation}>
              <Ionicons
                name={userLocation ? "location" : "location-outline"}
                size={22}
                color={userLocation ? "#10B981" : "#1F2937"}
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
            <TouchableOpacity
              onPress={() => setRadiusKm(radiusKm === 1000 ? 5 : 1000)}
              style={[styles.chip, radiusKm === 1000 && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  radiusKm === 1000 && styles.chipTextActive,
                ]}
              >
                {radiusKm === 1000 ? "All" : "Nearby"}
              </Text>
            </TouchableOpacity>
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
              onPress={() => {
                console.log('Navigating to service with item:', item);
                console.log('Item ID:', item.id);
                console.log('Item ID type:', typeof item.id);
                if (item.id && item.id !== 'undefined') {
                  router.push(`/services/${item.id}`);
                } else {
                  console.error('Invalid item ID for navigation:', item.id);
                  Alert.alert('Error', 'Unable to open service details. Please try again.');
                }
              }}
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
                    {(() => {
                      if (!userLocation || !item.location) {
                        return userLocation ? "Location not available" : "Enable location for distance";
                      }
                      
                      const distance = item.distance !== undefined 
                        ? item.distance 
                        : haversineKm(
                            userLocation.latitude,
                            userLocation.longitude,
                            item.location.latitude,
                            item.location.longitude
                          );
                      
                      return distance !== null && distance !== undefined 
                        ? `${distance.toFixed(1)} km away`
                        : "Distance unavailable";
                    })()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* LOCATE ME FAB */}
      <TouchableOpacity
        style={[styles.fab, locationLoading && styles.fabLoading]}
        onPress={requestLocation}
        disabled={locationLoading}
      >
        {locationLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons 
            name={userLocation ? "navigate" : "location-outline"} 
            size={22} 
            color="white" 
          />
        )}
      </TouchableOpacity>
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

  floatingHeader: {
    position: "absolute",
    top: 60, // Moved down more
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

  userMarker: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },
  userMarkerInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 2,
  },
  userMarkerPulse: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4F46E5",
    opacity: 0.2,
    zIndex: 1,
  },

  // Bottom List
  bottomListContainer: {
    position: "absolute",
    bottom: 100, // Increased to avoid tab bar overlap
    left: 0,
    right: 0,
    maxHeight: height * 0.25, // Smaller height
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
    bottom: 220, // Adjusted for tab bar space
    right: 20,
    backgroundColor: "#4F46E5",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabLoading: {
    backgroundColor: "#9CA3AF",
  },
});
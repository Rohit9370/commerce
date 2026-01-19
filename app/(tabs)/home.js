import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { Input, Typography } from '../../src/components/ui';
import { colors, spacing } from '../../src/constants/theme';
import { fetchAllServices } from '../../store/slices/servicesSlice';
import { db } from '../services/firebaseconfig';

const { width, height } = Dimensions.get('window');

const UserHomeScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { userData, role } = useSelector((state) => state.auth);
  
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [selectedShop, setSelectedShop] = useState(null);
  
  const mapRef = useRef(null);
  const radiusOptions = [2, 5, 10, 20];

  const DEFAULT_REGION = {
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Redirect non-users
  useEffect(() => {
    if (role && role !== 'user') {
      if (role === 'admin' || role === 'shopkeeper') {
        router.replace('/(tabs)/admin-home');
      } else if (role === 'super-admin') {
        router.replace('/(tabs)/super-admin-home');
      }
    }
  }, [role]);

  useEffect(() => {
    initializeLocation();
    fetchShops();
    dispatch(fetchAllServices());
  }, []);

  useEffect(() => {
    filterShops();
  }, [shops, searchQuery, radiusKm, userLocation]);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show nearby services');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(userLoc);

      // Animate to user location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...userLoc,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const fetchShops = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', 'in', ['admin', 'shopkeeper'])
      );
      const querySnapshot = await getDocs(q);
      
      const shopsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const location = data.location || {};
        
        return {
          id: doc.id,
          ...data,
          latitude: parseFloat(location.latitude) || 0,
          longitude: parseFloat(location.longitude) || 0,
          distance: 0,
          isOpen: checkIfOpen(data.timing),
        };
      }).filter(shop => shop.latitude && shop.longitude);

      setShops(shopsData);
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfOpen = (timing) => {
    if (!timing || !timing.open || !timing.close) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const openTime = parseTime(timing.open);
    const closeTime = parseTime(timing.close);
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const parseTime = (timeString) => {
    if (!timeString) return 0;
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    
    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes = minutes;
    }
    
    return totalMinutes;
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
              
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const filterShops = () => {
    let filtered = [...shops];

    // Calculate distances if user location is available
    if (userLocation) {
      filtered = filtered.map(shop => ({
        ...shop,
        distance: haversineDistance(
          userLocation.latitude,
          userLocation.longitude,
          shop.latitude,
          shop.longitude
        ),
      }));

      // Filter by radius
      filtered = filtered.filter(shop => shop.distance <= radiusKm);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shop =>
        shop.shopName?.toLowerCase().includes(query) ||
        shop.category?.toLowerCase().includes(query) ||
        shop.fullName?.toLowerCase().includes(query)
      );
    }

    // Sort by distance
    filtered.sort((a, b) => a.distance - b.distance);
    
    setFilteredShops(filtered);
  };

  const handleShopPress = (shop) => {
    setSelectedShop(shop);
    router.push(`/services/${shop.id}`);
  };

  const handleLocateMe = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    } else {
      initializeLocation();
    }
  };

  const renderShopCard = ({ item }) => (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => handleShopPress(item)}
      activeOpacity={0.95}
    >
      <View style={styles.shopCardContent}>
        <View style={styles.shopInfo}>
          <Typography variant="h6" numberOfLines={1}>
            {item.shopName || item.fullName || 'Unknown Shop'}
          </Typography>
          <Typography variant="body2" color="secondary" numberOfLines={1}>
            {item.category || 'Service Provider'}
          </Typography>
          <View style={styles.shopMeta}>
            <View style={styles.distanceContainer}>
              <Ionicons name="location-outline" size={14} color={colors.gray[500]} />
              <Typography variant="caption" color="secondary">
                {item.distance ? `${item.distance.toFixed(1)} km` : 'Distance unknown'}
              </Typography>
            </View>
            <View style={[styles.statusBadge, item.isOpen ? styles.openBadge : styles.closedBadge]}>
              <Typography 
                variant="caption" 
                color={item.isOpen ? "success" : "error"}
                weight="medium"
              >
                {item.isOpen ? 'Open' : 'Closed'}
              </Typography>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="body1" color="secondary" style={{ marginTop: 16 }}>
            Loading nearby services...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h4" weight="bold">
          Find Services
        </Typography>
        <Typography variant="body2" color="secondary">
          Discover local services near you
        </Typography>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search services, shops..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          style={styles.searchInput}
        />
      </View>

      {/* Radius Filter */}
      <View style={styles.filterContainer}>
        <Typography variant="body2" color="secondary" style={{ marginRight: 12 }}>
          Radius:
        </Typography>
        {radiusOptions.map((radius) => (
          <TouchableOpacity
            key={radius}
            style={[
              styles.radiusButton,
              radiusKm === radius && styles.activeRadiusButton,
            ]}
            onPress={() => setRadiusKm(radius)}
          >
            <Typography
              variant="caption"
              color={radiusKm === radius ? "inverse" : "secondary"}
              weight="medium"
            >
              {radius}km
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={DEFAULT_REGION}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {filteredShops.map((shop) => (
            <Marker
              key={shop.id}
              coordinate={{
                latitude: shop.latitude,
                longitude: shop.longitude,
              }}
              onPress={() => setSelectedShop(shop)}
            >
              <View style={[styles.markerContainer, shop.isOpen ? styles.openMarker : styles.closedMarker]}>
                <Ionicons 
                  name="storefront" 
                  size={20} 
                  color={shop.isOpen ? colors.success : colors.error} 
                />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Locate Me Button */}
        <TouchableOpacity style={styles.locateButton} onPress={handleLocateMe}>
          <Ionicons name="locate" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Shop List */}
      <View style={styles.listContainer}>
        <Typography variant="h6" weight="semiBold" style={{ marginBottom: 12 }}>
          Nearby Services ({filteredShops.length})
        </Typography>
        <FlatList
          data={filteredShops}
          renderItem={renderShopCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
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
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  radiusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  activeRadiusButton: {
    backgroundColor: colors.primary,
  },
  mapContainer: {
    height: height * 0.35,
    marginHorizontal: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
  },
  openMarker: {
    borderColor: colors.success,
  },
  closedMarker: {
    borderColor: colors.error,
  },
  locateButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  shopCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  shopCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopInfo: {
    flex: 1,
  },
  shopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  openBadge: {
    backgroundColor: colors.statusBg.success,
  },
  closedBadge: {
    backgroundColor: colors.statusBg.error,
  },
});

export default UserHomeScreen;
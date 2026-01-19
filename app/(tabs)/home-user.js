import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserRole } from '../../hooks/useUserRole';
import { db } from '../services/firebaseconfig';

export default function UserHomeScreen() {
  const router = useRouter();
  const { userData, loading: roleLoading } = useUserRole();
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchShops = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', 'in', ['admin', 'shopkeeper'])
      );
      const querySnapshot = await getDocs(q);
      const shopsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Filter shops with valid coordinates
      const shopsWithCoords = shopsData.filter(shop => 
        shop.location && shop.location.latitude && shop.location.longitude
      );
      
      setShops(shopsWithCoords);
      setFilteredShops(shopsWithCoords);
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredShops(shops);
      return;
    }
    const filtered = shops.filter(
      (shop) =>
        shop.shopName?.toLowerCase().includes(text.toLowerCase()) ||
        shop.category?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredShops(filtered);
  };

  if (roleLoading || loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.userHeader}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>
              Hi, {userData?.fullName?.split(' ')[0] || 'User'} 👋
            </Text>
            <Text style={styles.subText}>Find best services near you</Text>
          </View>
          <TouchableOpacity style={styles.profileIcon} onPress={() => router.push('/(tabs)/notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrapper}>
          <Ionicons
            name="search"
            size={20}
            color="#9CA3AF"
            style={{ marginLeft: 15 }}
          />
          <TextInput
            placeholder="Search for services..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredShops}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: filteredShops.length > 0 ? filteredShops[0].location.latitude : 28.6139,
                longitude: filteredShops.length > 0 ? filteredShops[0].location.longitude : 77.2090,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              {filteredShops.map((shop) => (
                <Marker
                  key={shop.id}
                  coordinate={{
                    latitude: shop.location.latitude,
                    longitude: shop.location.longitude,
                  }}
                  title={shop.shopName}
                  description={shop.category}
                  onPress={() => router.push(`/services/${shop.id}`)}
                />
              ))}
            </MapView>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/services/${item.id}`)}
          >
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
              {item.shopImages?.length > 0 ? (
                item.shopImages.map((img, i) => (
                  <Image
                    key={i}
                    source={{ uri: img }}
                    style={styles.shopImg}
                    contentFit="cover"
                  />
                ))
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="image-outline" size={48} color="#cbd5e1" />
                </View>
              )}
            </ScrollView>
            <View style={styles.infoContainer}>
              <View style={styles.rowBetween}>
                <Text style={styles.shopName}>{item.shopName}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              </View>
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-sharp"
                  size={14}
                  color="#6366F1"
                />
                <Text style={styles.addressText} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchShops} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  userHeader: {
    backgroundColor: '#fff',
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  welcomeText: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  subText: { fontSize: 13, color: '#6B7280' },
  profileIcon: { padding: 10, backgroundColor: '#F3F4F6', borderRadius: 15 },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 15,
    height: 50,
  },
  searchInput: { flex: 1, paddingHorizontal: 10, fontWeight: '500' },

  mapContainer: {
    height: 200,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  map: {
    flex: 1,
    borderRadius: 25,
  },
  placeholderImage: {
    width: 400,
    height: 180,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
  },
  shopImg: { width: 400, height: 180 },
  infoContainer: { padding: 15 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopName: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: { color: '#6366F1', fontSize: 10, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  addressText: {
    color: '#6B7280',
    fontSize: 12,
    marginLeft: 5,
    flex: 1,
  },
});

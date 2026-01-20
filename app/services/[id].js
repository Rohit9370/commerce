import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useUserRole } from '../../hooks/useUserRole';
import { selectAuth } from '../../store';
import { db } from '../services/firebaseconfig';

export default function ServiceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // Get all params
  const { id } = params; // Get the id from route params
  
  const dispatch = useDispatch();
  const { userData: user } = useUserRole();
  const { uid: userId } = useSelector(selectAuth);
  
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchShopDetails();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchShopDetails = async () => {
    if (!id || id === 'undefined') {
      setLoading(false);
      return;
    }
    
    try {
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setShopData(data);
      } else {
        Alert.alert('Error', 'Service not found');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to load shop details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = () => {
    if (!userId) {
      Alert.alert('Error', 'Please log in to book a service');
      return;
    }

    if (!id || id === 'undefined') {
      Alert.alert('Error', 'Invalid service ID');
      return;
    }

    if (!shopData) {
      Alert.alert('Error', 'Service information not loaded');
      return;
    }

    // Navigate to booking screen with proper parameters
    router.push({
      pathname: '/bookings/new',
      params: {
        serviceId: id,
        serviceName: encodeURIComponent(shopData?.category || 'Service'),
        shopId: id,
        shopName: encodeURIComponent(shopData?.shopName || shopData?.fullName || 'Unknown Shop'),
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!id || id === 'undefined') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Error: Service ID not provided</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!shopData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="storefront-outline" size={48} color="#64748b" />
          <Text style={styles.errorText}>Service not found</Text>
          <Text style={styles.errorSubText}>This service may no longer be available</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Details</Text>
          <View style={{ width: 24 }} /> {/* Spacer */}
        </View>

        {/* Shop Images */}
        <View style={styles.imageContainer}>
          {shopData.shopImages && shopData.shopImages.length > 0 ? (
            <Image
              source={{ uri: shopData.shopImages[0] }}
              style={styles.shopImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={48} color="#cbd5e1" />
              <Text style={styles.placeholderText}>No Image Available</Text>
            </View>
          )}
        </View>

        {/* Shop Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.shopName}>{shopData.shopName}</Text>
          <Text style={styles.category}>{shopData.category}</Text>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#64748b" />
            <Text style={styles.address}>{shopData.address}</Text>
          </View>

          {/* Services offered */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services Offered</Text>
            {shopData.services && Array.isArray(shopData.services) && shopData.services.length > 0 ? (
              shopData.services.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name || 'Service'}</Text>
                    {service.description && (
                      <Text style={styles.serviceDescription}>{service.description}</Text>
                    )}
                  </View>
                  <Text style={styles.servicePrice}>{service.price || 'Price on request'}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noServicesText}>No services listed</Text>
            )}
          </View>

          {/* Timing */}
          {shopData.timing && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Hours</Text>
              <Text style={styles.timingText}>
                {shopData.timing.open} - {shopData.timing.close}
              </Text>
            </View>
          )}

          {/* Off Days */}
          {shopData.offDays && shopData.offDays.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Closed Days</Text>
              <Text style={styles.offDaysText}>
                {Array.isArray(shopData.offDays) ? shopData.offDays.join(', ') : shopData.offDays}
              </Text>
            </View>
          )}

          {/* Contact Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={16} color="#64748b" />
              <Text style={styles.contactText}>{shopData.shopPhone || 'N/A'}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={16} color="#64748b" />
              <Text style={styles.contactText}>{shopData.email || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Book Now Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookService}
          disabled={bookingLoading}
        >
          <Ionicons name="calendar-outline" size={20} color="#ffffff" />
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  errorSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  imageContainer: {
    height: 250,
  },
  shopImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
  },
  infoContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  shopName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  address: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4f46e5',
  },
  noServicesText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  timingText: {
    fontSize: 16,
    color: '#334155',
  },
  offDaysText: {
    fontSize: 16,
    color: '#334155',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 16,
    color: '#334155',
    marginLeft: 8,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bookButton: {
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
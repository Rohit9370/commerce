import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
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
import { createBooking } from '../../store/slices/bookingsSlice';
import { db } from '../services/firebaseconfig';

export default function ServiceDetailScreen({ id }) {
  const router = useRouter();
  
  console.log('ServiceDetailScreen rendered with id:', id);
  const dispatch = useDispatch();
  const { userData: user } = useUserRole();
  const { uid: userId } = useSelector(selectAuth);
  
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchShopDetails();
    }
  }, [id]);

  const fetchShopDetails = async () => {
    if (!id) {
      console.error('Service ID is missing');
      setLoading(false);
      return;
    }
    
    console.log('Fetching service details for ID:', id);
    
    try {
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);
      
      console.log('Document exists:', docSnap.exists());
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Service data:', data);
        setShopData(data);
      } else {
        console.log('No document found for ID:', id);
      }
    } catch (error) {
      console.error('Error fetching shop details:', error);
      Alert.alert('Error', `Failed to load shop details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please log in to book a service');
      return;
    }

    try {
      setBookingLoading(true);
      
      // Prepare booking data
      const bookingData = {
        userId: userId,
        userName: user?.fullName || 'User',
        shopId: id,
        shopName: shopData?.shopName || 'Unknown Shop',
        serviceName: shopData?.category || 'Service',
        bookingDate: new Date(),
        bookingTime: new Date().toLocaleTimeString(),
        status: 'pending', // Default status
        price: shopData?.price || 0,
      };
      
      console.log('Creating booking with data:', bookingData);

      // Create booking using Redux action
      const result = await dispatch(createBooking(bookingData));
      
      if (result.meta.requestStatus === 'fulfilled') {
        Alert.alert(
          'Booking Request Sent!',
          'Your booking request has been sent to the service provider. They will accept or reject your request.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(tabs)/bookings')
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to book service. Please try again.');
      }
    } catch (error) {
      console.error('Error booking service:', error);
      Alert.alert('Error', 'Failed to book service. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Error: Service ID not provided</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!shopData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Service not found</Text>
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
            {shopData.services && shopData.services.length > 0 ? (
              shopData.services.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>{service.price}</Text>
                </View>
              ))
            ) : (
              <Text>No services listed</Text>
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
              <Text style={styles.offDaysText}>{shopData.offDays.join(', ')}</Text>
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
          {bookingLoading ? (
            <>
              <Ionicons name="time-outline" size={20} color="#ffffff" />
              <Text style={styles.bookButtonText}>Sending Request...</Text>
            </>
          ) : (
            <>
              <Ionicons name="calendar-outline" size={20} color="#ffffff" />
              <Text style={styles.bookButtonText}>Book Now</Text>
            </>
          )}
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
    alignItems: 'center',
    paddingVertical: 8,
  },
  serviceName: {
    fontSize: 16,
    color: '#334155',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4f46e5',
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
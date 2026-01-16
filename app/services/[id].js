import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../services/firebaseconfig';

export default function ServiceDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookable, setIsBookable] = useState(false);

  useEffect(() => {
    fetchServiceDetails();
  }, [id]);

  const fetchServiceDetails = async () => {
    try {
      const docRef = await getDoc(doc(db, 'users', id));
      if (docRef.exists()) {
        const serviceData = docRef.data();
        setService(serviceData);
        
        // Check if shop is open based on timing
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Convert time strings to minutes for comparison
        if (serviceData.timing) {
          const openTime = parseTimeString(serviceData.timing.open);
          const closeTime = parseTimeString(serviceData.timing.close);
          
          // Calculate if shop is currently open
          const currentMinutes = currentHour * 60 + currentMinute;
          setIsBookable(currentMinutes >= openTime && currentMinutes <= closeTime);
        }
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
      Alert.alert('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const parseTimeString = (timeStr) => {
    // Parse time string like "8:48 AM" or "8:48 PM"
    const [time, period] = timeStr.split(/\s+/);
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  };

  const handleBooking = () => {
    if (!isBookable) {
      Alert.alert('Closed', 'This shop is currently closed. Bookings are only available during business hours.');
      return;
    }
    
    // Navigate to booking page with service details
    router.push(`/bookings/new?serviceId=${id}&serviceName=${encodeURIComponent(service?.shopName || '')}`);
  };

  const handleCall = () => {
    if (service?.shopPhone) {
      Linking.openURL(`tel:${service.shopPhone}`);
    }
  };

  const handleLocation = () => {
    if (service?.location) {
      const { latitude, longitude } = service.location;
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Service not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Details</Text>
          <View style={{ width: 24 }} /> {/* Spacer */}
        </View>

        {/* Enhanced Shop Banner with Carousel */}
        <View style={styles.bannerContainer}>
          {service.shopImages && service.shopImages.length > 0 ? (
            <>
              <FlatList
                data={service.shopImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <View style={styles.bannerSlide}>
                    <Image 
                      source={{ uri: item }} 
                      style={styles.bannerImage} 
                      contentFit="cover" 
                    />
                    <View style={styles.imageOverlay}>
                      <View style={styles.imageCounter}>
                        <Text style={styles.counterText}>
                          {index + 1}/{service.shopImages.length}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
                keyExtractor={(item, index) => index.toString()}
              />
            </>
          ) : (
            <View style={styles.placeholderBanner}>
              <Ionicons name="business" size={64} color="#9CA3AF" />
              <Text style={styles.placeholderText}>No Images Available</Text>
              <Text style={styles.placeholderSubtext}>{service.shopName}</Text>
            </View>
          )}
        </View>

        {/* Enhanced Shop Info */}
        <View style={styles.infoContainer}>
          <View style={styles.shopHeader}>
            <View style={styles.shopTitleContainer}>
              <Text style={styles.shopName}>{service.shopName}</Text>
              <Text style={styles.ownerName}>{service.ownerName || 'Shop Owner'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isBookable ? '#10B981' : '#EF4444' }]}>
              <Text style={styles.statusText}>{isBookable ? 'Open' : 'Closed'}</Text>
            </View>
          </View>
          
          {/* Category Section */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pricetags" size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Category</Text>
            </View>
            <View style={styles.chipContainer}>
              <View style={styles.categoryChip}>
                <Text style={styles.chipText}>{service.category}</Text>
              </View>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Location</Text>
            </View>
            <View style={styles.locationContainer}>
              <Ionicons name="location-sharp" size={16} color="#6366F1" />
              <Text style={styles.locationText} numberOfLines={3}>{service.address}</Text>
            </View>
          </View>

          {/* Timing Section */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Business Hours</Text>
            </View>
            <View style={styles.timingRow}>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Opens:</Text>
                <Text style={styles.timeValue}>{service.timing?.open || 'N/A'}</Text>
              </View>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Closes:</Text>
                <Text style={styles.timeValue}>{service.timing?.close || 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* Off Days Section */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Weekly Off Days</Text>
            </View>
            <View style={styles.daysContainer}>
              {service.offDays && service.offDays.length > 0 ? (
                <View style={styles.daysChips}>
                  {service.offDays.map((day, index) => (
                    <View key={index} style={styles.dayChip}>
                      <Text style={styles.dayChipText}>{day.substring(0,3)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDaysText}>No off days</Text>
              )}
            </View>
          </View>

          {/* Contact Section */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call" size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Contact</Text>
            </View>
            <View style={styles.contactContainer}>
              <Ionicons name="call" size={16} color="#6366F1" />
              <Text style={styles.contactText}>{service.shopPhone || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: isBookable ? '#6366F1' : '#9CA3AF' }]} 
            onPress={handleBooking}
            disabled={!isBookable}
          >
            <Ionicons name="calendar" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {isBookable ? 'Book Now' : 'Shop Closed'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10B981' }]} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F59E0B' }]} onPress={handleLocation}>
            <Ionicons name="location" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Direction</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    margin: 20,
    color: '#EF4444',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  bannerContainer: {
    height: 280,
  },
  bannerSlide: {
    width: '100%',
    height: '100%',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  imageCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  counterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  placeholderBanner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 10,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 5,
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: -30,
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 10,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  shopTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  shopName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  detailSection: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  chipText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 14,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  daysContainer: {
    marginTop: 8,
  },
  daysChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  noDaysText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 15,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#15803D',
    marginLeft: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 15,
    minWidth: 80,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 5,
  },
});
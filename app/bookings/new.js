import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useUserRole } from '../../hooks/useUserRole';
import { borderRadius, colors, shadows, spacing } from '../../src/constants/theme';
import { createBooking } from '../../store/slices/bookingsSlice';
import { db } from '../services/firebaseconfig';

export default function NewBookingScreen() {
  const { serviceId, serviceName, shopId, shopName } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { userData } = useUserRole();
  const { loading: bookingLoading, error } = useSelector((state) => state.bookings);

  // State Management
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateSelected, setDateSelected] = useState(false);
  const [timeSelected, setTimeSelected] = useState(false);
  
  const [specialRequest, setSpecialRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [shopData, setShopData] = useState(null);

  console.log('NewBookingScreen params:', { serviceId, serviceName, shopId, shopName });

  // Fetch shop data for timing validation
  useEffect(() => {
    if (shopId) {
      fetchShopData();
    }
  }, [shopId]);

  const fetchShopData = async () => {
    try {
      const shopDoc = await getDoc(doc(db, 'users', shopId));
      if (shopDoc.exists()) {
        setShopData(shopDoc.data());
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    }
  };

  // Parse time string (e.g., "10:15 AM") to minutes since midnight
  const parseTimeString = (timeStr) => {
    if (!timeStr || timeStr === '24 Hours') return null;
    
    console.log('Parsing time string:', timeStr);
    
    const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) {
      console.log('Failed to match time format');
      return null;
    }
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    console.log('Parsed components:', { hours, minutes, period });
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    const totalMinutes = hours * 60 + minutes;
    console.log('Total minutes:', totalMinutes, '(', hours, ':', minutes, ')');
    
    return totalMinutes;
  };

  // Validate if selected time is within shop working hours
  const isTimeValid = (selectedTime) => {
    if (!shopData || !shopData.timing) {
      console.log('No shop data or timing, allowing');
      return true;
    }
    
    // If shop is open 24 hours, always allow
    if (shopData.timing.isOpen24Hours || 
        shopData.timing.open === '24 Hours' || 
        shopData.timing.close === '24 Hours') {
      console.log('Shop is 24 hours, allowing');
      return true;
    }
    
    const selectedHour = selectedTime.getHours();
    const selectedMinute = selectedTime.getMinutes();
    const selectedTotalMinutes = selectedHour * 60 + selectedMinute;
    
    console.log('Selected time in minutes:', selectedTotalMinutes, '(', selectedHour, ':', selectedMinute, ')');
    
    const openTimeMinutes = parseTimeString(shopData.timing.open);
    const closeTimeMinutes = parseTimeString(shopData.timing.close);
    
    console.log('Shop open minutes:', openTimeMinutes);
    console.log('Shop close minutes:', closeTimeMinutes);
    
    // If we can't parse the times, allow booking
    if (openTimeMinutes === null || closeTimeMinutes === null) {
      console.log('Could not parse shop times, allowing');
      return true;
    }
    
    // Check if selected time is within working hours
    let isValid = false;
    if (closeTimeMinutes >= openTimeMinutes) {
      // Normal case: shop opens and closes on same day
      isValid = selectedTotalMinutes >= openTimeMinutes && selectedTotalMinutes <= closeTimeMinutes;
      console.log('Normal hours check:', isValid, '(', selectedTotalMinutes, '>=', openTimeMinutes, '&&', selectedTotalMinutes, '<=', closeTimeMinutes, ')');
    } else {
      // Overnight case: shop closes after midnight
      isValid = selectedTotalMinutes >= openTimeMinutes || selectedTotalMinutes <= closeTimeMinutes;
      console.log('Overnight hours check:', isValid);
    }
    
    return isValid;
  };

  // Check if selected date is not an off day
  const isDateValid = (selectedDate) => {
    if (!shopData || !shopData.offDays) return true;
    
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    return !shopData.offDays.includes(dayName);
  };

  // Handlers
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (!isDateValid(selectedDate)) {
        Alert.alert(
          'Shop Closed', 
          `This shop is closed on ${selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}s. Please select another date.`
        );
        return;
      }
      setDate(selectedDate);
      setDateSelected(true);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      console.log('Selected time:', selectedTime.toLocaleTimeString());
      console.log('Shop timing:', shopData?.timing);
      
      if (!isTimeValid(selectedTime)) {
        const openTime = shopData?.timing?.open || 'N/A';
        const closeTime = shopData?.timing?.close || 'N/A';
        
        console.log('Time validation failed. Shop hours:', openTime, 'to', closeTime);
        
        // Check if shop is 24 hours
        if (shopData?.timing?.isOpen24Hours || 
            shopData?.timing?.open === '24 Hours' || 
            shopData?.timing?.close === '24 Hours') {
          console.log('Shop is 24 hours, allowing time');
          setTime(selectedTime);
          setTimeSelected(true);
          return;
        }
        
        Alert.alert(
          'Outside Working Hours', 
          `This shop is only open from ${openTime} to ${closeTime}. Please select a time within these hours.`
        );
        return;
      }
      
      console.log('Time validation passed');
      setTime(selectedTime);
      setTimeSelected(true);
    }
  };

  const handleSubmitBooking = async () => {
    if (!dateSelected || !timeSelected) {
      Alert.alert('Missing Info', 'Please select both date and time for your appointment.');
      return;
    }

    if (!userData?.uid) {
      Alert.alert('Error', 'Please log in to book a service.');
      return;
    }

    if (!serviceId || !shopId) {
      Alert.alert('Error', 'Missing service information. Please try again.');
      return;
    }

    // Final validation before submission
    if (!isDateValid(date)) {
      Alert.alert('Invalid Date', 'Selected date is not available. Please choose another date.');
      return;
    }

    if (!isTimeValid(time)) {
      Alert.alert('Invalid Time', 'Selected time is outside working hours. Please choose another time.');
      return;
    }

    try {
      const bookingData = {
        serviceId: serviceId,
        serviceName: decodeURIComponent(serviceName || 'Service'),
        shopId: shopId,
        shopName: decodeURIComponent(shopName || shopData?.shopName || shopData?.fullName || 'Unknown Shop'),
        userId: userData.uid,
        userName: userData.fullName || userData.ownerName || 'User',
        userEmail: userData.email,
        userPhone: userData.phone || '',
        bookingDate: date.toLocaleDateString('en-GB'), // DD/MM/YYYY
        bookingTime: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        specialRequest: specialRequest.trim(),
        status: 'pending',
        serviceProviderId: shopId,
      };

      console.log('Submitting booking with data:', bookingData);

      const result = await dispatch(createBooking(bookingData)).unwrap();
      
      console.log('Booking created successfully:', result);

      Alert.alert(
        'Booking Request Sent!', 
        'The service provider will review your request and get back to you shortly.',
        [
          { 
            text: 'View My Bookings', 
            onPress: () => router.replace('/(tabs)/bookings') 
          },
          { 
            text: 'Done', 
            onPress: () => router.back() 
          }
        ]
      );
    } catch (error) {
      console.error('Booking creation error:', error);
      Alert.alert(
        'Booking Failed', 
        error.message || 'Something went wrong while creating your booking. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        {/* Modern Header */}
        <LinearGradient
          colors={colors.gradients.primary}
          style={styles.modernHeader}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Book Service</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Service Summary Card */}
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={['#F8FAFC', '#F1F5F9']}
              style={styles.summaryGradient}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.summaryLabel}>Booking for</Text>
                <Text style={styles.summaryValue}>{decodeURIComponent(serviceName)}</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Select Date & Time</Text>
            
            <View style={styles.row}>
              {/* Date Picker Button */}
              <TouchableOpacity 
                style={[styles.pickerBtn, dateSelected && styles.pickerBtnActive]} 
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={dateSelected ? colors.primary : colors.gray[400]} />
                <Text style={[styles.pickerBtnText, dateSelected && styles.pickerBtnTextActive]}>
                  {dateSelected ? date.toLocaleDateString('en-GB') : "Choose Date"}
                </Text>
              </TouchableOpacity>

              {/* Time Picker Button */}
              <TouchableOpacity 
                style={[styles.pickerBtn, timeSelected && styles.pickerBtnActive]} 
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time" size={20} color={timeSelected ? colors.primary : colors.gray[400]} />
                <Text style={[styles.pickerBtnText, timeSelected && styles.pickerBtnTextActive]}>
                  {timeSelected ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Choose Time"}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                minimumDate={new Date()}
                onChange={onDateChange}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                onChange={onTimeChange}
              />
            )}

            <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Special Instructions</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Ex: Please bring a ladder, arrive at the back door, etc."
                placeholderTextColor={colors.gray[400]}
                value={specialRequest}
                onChangeText={setSpecialRequest}
                multiline
                numberOfLines={5}
              />
            </View>
          </View>

          {/* Guidelines */}
          <View style={styles.infoBox}>
            <LinearGradient
              colors={['#EFF6FF', '#DBEAFE']}
              style={styles.infoGradient}
            >
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.infoText}>
                Your request will be sent to the provider. Payment terms are settled directly after service completion.
              </Text>
            </LinearGradient>
          </View>

        </ScrollView>

        {/* Floating Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.mainBtn, bookingLoading && styles.disabledBtn]} 
            onPress={handleSubmitBooking}
            disabled={bookingLoading}
          >
            <LinearGradient
              colors={bookingLoading ? [colors.gray[400], colors.gray[500]] : colors.gradients.primary}
              style={styles.buttonGradient}
            >
              {bookingLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.mainBtnText}>Confirm Appointment</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.white} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  modernHeader: {
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: colors.white 
  },
  scrollContent: { 
    padding: spacing.xl, 
    paddingBottom: 120 
  },
  
  summaryCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing['3xl'],
    ...shadows.md,
  },
  summaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  summaryLabel: { 
    fontSize: 13, 
    color: colors.text.secondary, 
    fontWeight: '500' 
  },
  summaryValue: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.text.primary,
    marginTop: 2,
  },

  formSection: { 
    backgroundColor: colors.white, 
    padding: spacing.xl, 
    borderRadius: borderRadius.xl, 
    ...shadows.md,
    marginBottom: spacing.xl,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.text.primary, 
    marginBottom: spacing.lg 
  },
  
  row: { 
    flexDirection: 'row', 
    gap: spacing.lg 
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.gray[50],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  pickerBtnActive: { 
    borderColor: colors.primary, 
    backgroundColor: colors.primary + '10' 
  },
  pickerBtnText: { 
    color: colors.text.secondary, 
    fontWeight: '500', 
    fontSize: 14 
  },
  pickerBtnTextActive: { 
    color: colors.text.primary 
  },

  textAreaContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  textArea: { 
    fontSize: 15, 
    color: colors.text.primary, 
    height: 100, 
    textAlignVertical: 'top' 
  },

  infoBox: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  infoGradient: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: { 
    flex: 1, 
    fontSize: 13, 
    color: colors.text.secondary, 
    lineHeight: 18 
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.lg,
  },
  mainBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  mainBtnText: { 
    color: colors.white, 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  disabledBtn: { 
    opacity: 0.7 
  },
});
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker'; // Install: npx expo install @react-native-community/datetimepicker
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
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
import { useUserRole } from '../../hooks/useUserRole';
import { db } from '../services/firebaseconfig';

export default function NewBookingScreen() {
  const { serviceId, serviceName } = useLocalSearchParams();
  const router = useRouter();
  const { userData } = useUserRole();

  // State Management
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateSelected, setDateSelected] = useState(false);
  const [timeSelected, setTimeSelected] = useState(false);
  
  const [specialRequest, setSpecialRequest] = useState('');
  const [loading, setLoading] = useState(false);

  // Handlers
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setDateSelected(true);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
      setTimeSelected(true);
    }
  };

  const handleSubmitBooking = async () => {
    if (!dateSelected || !timeSelected) {
      Alert.alert('Missing Info', 'Please select both date and time for your appointment.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        serviceId,
        serviceName: decodeURIComponent(serviceName),
        userId: userData.uid,
        userName: userData.fullName || userData.ownerName || 'User',
        userEmail: userData.email,
        bookingDate: date.toLocaleDateString('en-GB'), // DD/MM/YYYY
        bookingTime: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        specialRequest,
        status: 'pending',
        createdAt: serverTimestamp(),
        serviceProviderId: serviceId,
      });

      Alert.alert('Request Sent!', 'The service provider will review your request shortly.', [
        { text: 'View My Bookings', onPress: () => router.replace('/(tabs)/bookings') },
        { text: 'Done', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Booking</Text>
          <View style={{ width: 45 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Service Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={24} color="#6366F1" />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.summaryLabel}>Booking for</Text>
              <Text style={styles.summaryValue}>{decodeURIComponent(serviceName)}</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Select Slot</Text>
            
            <View style={styles.row}>
              {/* Date Picker Button */}
              <TouchableOpacity 
                style={[styles.pickerBtn, dateSelected && styles.pickerBtnActive]} 
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={dateSelected ? "#6366F1" : "#9CA3AF"} />
                <Text style={[styles.pickerBtnText, dateSelected && styles.pickerBtnTextActive]}>
                  {dateSelected ? date.toLocaleDateString('en-GB') : "Choose Date"}
                </Text>
              </TouchableOpacity>

              {/* Time Picker Button */}
              <TouchableOpacity 
                style={[styles.pickerBtn, timeSelected && styles.pickerBtnActive]} 
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time" size={20} color={timeSelected ? "#6366F1" : "#9CA3AF"} />
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
                placeholderTextColor="#9CA3AF"
                value={specialRequest}
                onChangeText={setSpecialRequest}
                multiline
                numberOfLines={5}
              />
            </View>
          </View>

          {/* Guidelines */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              Your request will be sent to the provider. Payment terms are settled directly after service completion.
            </Text>
          </View>

        </ScrollView>

        {/* Floating Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.mainBtn, loading && styles.disabledBtn]} 
            onPress={handleSubmitBooking}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.mainBtnText}>Confirm Appointment</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFE' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 24,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#1F2937' },

  formSection: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, elevation: 1, shadowOpacity: 0.05 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 15 },
  
  row: { flexDirection: 'row', gap: 12 },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFB',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerBtnActive: { borderColor: '#6366F1', backgroundColor: '#F5F7FF' },
  pickerBtnText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
  pickerBtnTextActive: { color: '#1F2937' },

  textAreaContainer: {
    backgroundColor: '#F8FAFB',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: { fontSize: 15, color: '#1F2937', height: 100, textAlignVertical: 'top' },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 15,
    borderRadius: 15,
    marginTop: 20,
    gap: 10,
    alignItems: 'center',
  },
  infoText: { flex: 1, fontSize: 12, color: '#64748B', lineHeight: 18 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  mainBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    gap: 10,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  disabledBtn: { backgroundColor: '#9CA3AF' },
});
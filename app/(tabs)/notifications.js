import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useUserRole } from '../../hooks/useUserRole';
import { selectAuth } from '../../store';
import { db } from '../services/firebaseconfig';

export default function NotificationsScreen() {
  const router = useRouter();
  const { userRole } = useUserRole();
  const { uid } = useSelector(selectAuth);
  const dispatch = useDispatch();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    
    if (userRole === 'admin' || userRole === 'shopkeeper') {
      // For service providers, listen to new booking requests
      const q = query(
        collection(db, 'bookings'),
        where('shopId', '==', uid),
        where('status', '==', 'pending')
      );
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        console.log(`Notification listener triggered for shopId: ${uid}`);
        console.log(`Found ${snapshot.size} documents`);
        
        const newNotifications = [];
        snapshot.docChanges().forEach((change) => {
          console.log(`Document change type: ${change.type}`);
          console.log(`Document data:`, change.doc.data());
          
          if (change.type === 'added') {
            const bookingData = change.doc.data();
            newNotifications.push({
              id: change.doc.id,
              title: 'New Booking Request',
              body: `${bookingData.userName} wants to book ${bookingData.serviceName}`,
              createdAt: bookingData.createdAt || new Date(),
              bookingId: change.doc.id,
              userId: bookingData.userId,
              type: 'booking_request',
            });
          }
        });
        
        if (newNotifications.length > 0) {
          setNotifications(prev => [...newNotifications, ...prev]);
        }
        setLoading(false);
      });
    } else {
      // For regular users, we can show their booking status updates
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', uid)
      );
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const newNotifications = [];
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const bookingData = change.doc.data();
            let notificationTitle = 'Booking Status Updated';
            let notificationBody = `Your booking for ${bookingData.serviceName} is now ${bookingData.status}.`;
            
            if (bookingData.status === 'accepted') {
              notificationTitle = 'Booking Accepted!';
              notificationBody = `Your booking for ${bookingData.serviceName} has been accepted.`;
            } else if (bookingData.status === 'rejected') {
              notificationTitle = 'Booking Rejected';
              notificationBody = `Your booking for ${bookingData.serviceName} has been rejected.`;
            } else if (bookingData.status === 'confirmed') {
              notificationTitle = 'Booking Confirmed';
              notificationBody = `Your booking for ${bookingData.serviceName} has been confirmed.`;
            } else if (bookingData.status === 'completed') {
              notificationTitle = 'Booking Completed';
              notificationBody = `Your booking for ${bookingData.serviceName} has been completed.`;
            }
            
            newNotifications.push({
              id: change.doc.id,
              title: notificationTitle,
              body: notificationBody,
              createdAt: bookingData.updatedAt || new Date(),
              bookingId: change.doc.id,
              shopId: bookingData.shopId,
              type: 'booking_status',
            });
          }
        });
        
        if (newNotifications.length > 0) {
          setNotifications(prev => [...newNotifications, ...prev]);
        }
        setLoading(false);
      });
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userRole, uid]);

  const handleNotificationPress = (notification) => {
    if (notification.type === 'booking_request' && (userRole === 'admin' || userRole === 'shopkeeper')) {
      router.push('/(tabs)/bookings');
    } else if (notification.type === 'booking_status') {
      router.push('/(tabs)/bookings');
    }
  };

  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>
      <FlatList
        data={sortedNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => handleNotificationPress(item)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </View>
            <Text style={styles.cardBody}>{item.body}</Text>
            <Text style={styles.cardTime}>{new Date(item.createdAt).toLocaleString()}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 16, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  mark: { color: '#4f46e5', fontWeight: '600' },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', flex: 1 },
  cardBody: { color: '#64748b', marginBottom: 8, lineHeight: 20 },
  cardTime: { color: '#94a3b8', fontSize: 12 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

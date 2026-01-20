import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useUserRole } from '../../hooks/useUserRole';
import { selectAuth } from '../../store';
import { db } from '../services/firebaseconfig';


export default function AdminHomeScreen({ userData }) {
  const router = useRouter();
  const { userData: authUserData } = useUserRole();
  const { uid } = useSelector(selectAuth);
  const [shopData, setShopData] = useState(userData || authUserData);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalBookings: 0, activeServices: 0, reviews: 0 });
  

  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeUpdating, setTimeUpdating] = useState(false);
  const [newTiming, setNewTiming] = useState({
    open: '',
    close: '',
    isOpen24Hours: false
  });

  const [showOpenTimePicker, setShowOpenTimePicker] = useState(false);
  const [showCloseTimePicker, setShowCloseTimePicker] = useState(false);
  const [openTime, setOpenTime] = useState(new Date());
  const [closeTime, setCloseTime] = useState(new Date());

  const [currentTime, setCurrentTime] = useState(new Date());


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async (shopInfo) => {
    if (!uid) return;
    
    try {

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('providerId', '==', uid)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const totalBookings = bookingsSnapshot.size;

      const activeServices = shopInfo?.services?.filter(service => service.active !== false).length || 0;

    
      let reviewsCount = 0;
      try {
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('providerId', '==', uid)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        reviewsCount = reviewsSnapshot.size;
      } catch (reviewError) {

        console.log('Reviews collection not found, using 0');
        reviewsCount = 0;
      }

      setStats({
        totalBookings,
        activeServices,
        reviews: reviewsCount
      });
    } catch (error) {
      console.error('Error fetching real stats:', error);
   
      setStats({
        totalBookings: 0,
        activeServices: shopInfo?.services?.length || 0,
        reviews: 0
      });
    }
  };

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        if (uid) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setShopData(data);
     
            if (data.timing) {
              setNewTiming({
                open: data.timing.open || '',
                close: data.timing.close || '',
                isOpen24Hours: data.timing.isOpen24Hours || false
              });
           
              if (data.timing.open && data.timing.open !== '24 Hours') {
                const openTimeDate = parseTimeString(data.timing.open);
                if (openTimeDate) setOpenTime(openTimeDate);
              }
              
              if (data.timing.close && data.timing.close !== '24 Hours') {
                const closeTimeDate = parseTimeString(data.timing.close);
                if (closeTimeDate) setCloseTime(closeTimeDate);
              }
            }

            await fetchStats(data);
          }
        }
      } catch (error) {
        console.error('Error fetching shop data:', error);
      }
      setLoading(false);
    };
    
    fetchShopData();
  }, [uid]);


  const parseTimeString = (timeStr) => {
    if (!timeStr || timeStr === '24 Hours') return null;
    
    const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return null;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTimeString = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

 
  const handleOpenTimeChange = (event, selectedTime) => {
    setShowOpenTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setOpenTime(selectedTime);
      const formattedTime = formatTimeString(selectedTime);
      setNewTiming(prev => ({
        ...prev,
        open: formattedTime
      }));
    }
  };

  const handleCloseTimeChange = (event, selectedTime) => {
    setShowCloseTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setCloseTime(selectedTime);
      const formattedTime = formatTimeString(selectedTime);
      setNewTiming(prev => ({
        ...prev,
        close: formattedTime
      }));
    }
  };


  const updateShopTiming = async () => {
    if (!uid) return;
    
    if (!newTiming.isOpen24Hours && (!newTiming.open || !newTiming.close)) {
      Alert.alert('Error', 'Please set both opening and closing times.');
      return;
    }
    
    setTimeUpdating(true);
    try {
      const updatedTiming = {
        open: newTiming.isOpen24Hours ? '24 Hours' : newTiming.open,
        close: newTiming.isOpen24Hours ? '24 Hours' : newTiming.close,
        isOpen24Hours: newTiming.isOpen24Hours,
        lastUpdated: new Date().toISOString()
      };

      await updateDoc(doc(db, 'users', uid), {
        timing: updatedTiming
      });


      setShopData(prev => ({
        ...prev,
        timing: updatedTiming
      }));

      Alert.alert('Success', 'Shop timing updated successfully!');
      setShowTimeModal(false);
      setShowOpenTimePicker(false);
      setShowCloseTimePicker(false);

      setTimeout(async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const refreshedData = userDoc.data();
            setShopData(refreshedData);
        
            await fetchStats(refreshedData);
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      }, 500);
      
    } catch (error) {
      console.error('Error updating timing:', error);
      Alert.alert('Error', 'Failed to update timing. Please try again.');
    } finally {
      setTimeUpdating(false);
    }
  };

  const isShopOpen = () => {
    if (!shopData?.timing) return false;
    

    if (shopData.timing.isOpen24Hours || 
        shopData.timing.open === '24 Hours' || 
        shopData.timing.close === '24 Hours') {
      return true;
    }
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const parseTime = (timeStr) => {
      if (!timeStr || timeStr === '24 Hours') return 0;
      const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (!match) return 0;
      
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      return hours * 60 + minutes;
    };
    
    const openTime = parseTime(shopData.timing.open);
    const closeTime = parseTime(shopData.timing.close);
    
 
    if (openTime === 0 && closeTime === 0) return false;
    
    if (closeTime >= openTime) {
      return currentTime >= openTime && currentTime <= closeTime;
    } else {
      return currentTime >= openTime || currentTime <= closeTime;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        overScrollMode="always"
      >
        {/* Header with Welcome */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.shopName}>{shopData?.shopName || shopData?.fullName || 'Service Provider'}</Text>
            <View style={styles.timeContainer}>
              <Text style={styles.currentTimeText}>
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </Text>
              <View style={[styles.statusBadge, isShopOpen() ? styles.openBadge : styles.closedBadge]}>
                <Text style={[styles.statusText, isShopOpen() ? styles.openText : styles.closedText]}>
                  {isShopOpen() ? 'OPEN' : 'CLOSED'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.avatarContainer} onPress={() => setShowTimeModal(true)}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="time" size={24} color="#4f46e5" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Shop Banner/Image */}
        <View style={styles.bannerContainer}>
          {shopData?.shopImages && shopData.shopImages.length > 0 ? (
            <Image
              source={{ uri: shopData.shopImages[0] }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.defaultBanner}>
              <Ionicons name="storefront" size={48} color="#6b7280" />
              <Text style={styles.bannerText}>Add Shop Image</Text>
              <Text style={styles.bannerSubtext}>Upload your shop photo to attract more customers</Text>
            </View>
          )}
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>{shopData?.shopName || 'Your Shop'}</Text>
            <Text style={styles.bannerCategory}>{shopData?.category || 'Service Provider'}</Text>
          </View>
        </View>

        {/* Timing Info Card */}
        <TouchableOpacity style={styles.timingCard} onPress={() => setShowTimeModal(true)}>
          <View style={styles.timingHeader}>
            <Ionicons name="time-outline" size={24} color="#4f46e5" />
            <Text style={styles.timingTitle}>Shop Timing</Text>
            <Ionicons name="create-outline" size={20} color="#6b7280" />
          </View>
          <View style={styles.timingContent}>
            {shopData?.timing ? (
              <>
                <Text style={styles.timingText}>
                  Open: {shopData.timing.open || 'Not set'}
                </Text>
                <Text style={styles.timingText}>
                  Close: {shopData.timing.close || 'Not set'}
                </Text>
                {shopData.timing.lastUpdated && (
                  <Text style={styles.lastUpdated}>
                    Last updated: {new Date(shopData.timing.lastUpdated).toLocaleDateString()}
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.noTimingText}>Tap to set your shop timing</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/bookings')}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar" size={24} color="#4f46e5" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{stats.totalBookings}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/services')}>
            <View style={styles.statIconContainer}>
              <Ionicons name="build" size={24} color="#10b981" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{stats.activeServices}</Text>
              <Text style={styles.statLabel}>Active Services</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="star" size={24} color="#f59e0b" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{stats.reviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Shop Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Shop Information</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="storefront-outline" size={20} color="#6b7280" />
            <Text style={styles.infoValue}>{shopData?.shopName || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#6b7280" />
            <Text style={styles.infoValue}>{shopData?.ownerName || shopData?.fullName || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#6b7280" />
            <Text style={styles.infoValue}>{shopData?.shopPhone || shopData?.phone || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#6b7280" />
            <Text style={styles.infoValue}>{shopData?.address || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color="#6b7280" />
            <Text style={styles.infoValue}>{shopData?.category || 'N/A'}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/services')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="build" size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionText}>Manage Services</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/bookings')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="calendar" size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionText}>View Bookings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowTimeModal(true)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="time" size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionText}>Update Timing</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="settings" size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Time Update Modal */}
      <Modal
        visible={showTimeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowTimeModal(false);
          setShowOpenTimePicker(false);
          setShowCloseTimePicker(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Shop Timing</Text>
              <TouchableOpacity onPress={() => {
                setShowTimeModal(false);
                setShowOpenTimePicker(false);
                setShowCloseTimePicker(false);
              }}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setNewTiming(prev => ({ ...prev, isOpen24Hours: !prev.isOpen24Hours }))}
                >
                  <Ionicons
                    name={newTiming.isOpen24Hours ? "checkbox" : "square-outline"}
                    size={24}
                    color="#4f46e5"
                  />
                  <Text style={styles.checkboxLabel}>Open 24 Hours</Text>
                </TouchableOpacity>
              </View>

              {!newTiming.isOpen24Hours && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Opening Time</Text>
                    <TouchableOpacity
                      style={styles.timePickerButton}
                      onPress={() => setShowOpenTimePicker(true)}
                    >
                      <Ionicons name="time-outline" size={20} color="#6b7280" />
                      <Text style={styles.timePickerText}>
                        {newTiming.open || 'Select opening time'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Closing Time</Text>
                    <TouchableOpacity
                      style={styles.timePickerButton}
                      onPress={() => setShowCloseTimePicker(true)}
                    >
                      <Ionicons name="time-outline" size={20} color="#6b7280" />
                      <Text style={styles.timePickerText}>
                        {newTiming.close || 'Select closing time'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Time Pickers */}
              {showOpenTimePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={openTime}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleOpenTimeChange}
                />
              )}

              {showCloseTimePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={closeTime}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleCloseTimeChange}
                />
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowTimeModal(false);
                    setShowOpenTimePicker(false);
                    setShowCloseTimePicker(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={updateShopTiming}
                  disabled={timeUpdating}
                >
                  {timeUpdating ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}



import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth, setAuth } from '../store/slices/authSlice';
import { setOnboarded } from '../store/slices/onboardingSlice';
import { getAuthData, getOnboardingStatus, saveAuthData, saveOnboardingStatus } from '../utils/authStorage';
import OnboardingScreen from './onboarding';
import { auth, db } from './services/firebaseconfig';

const Index = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { hasOnboarded } = useSelector(state => state.onboarding);
  const { uid, role } = useSelector(state => state.auth);
  
  const [fontsLoaded] = useFonts({
    'Ro-reg': require('./assets/fonts/RobotoCondensed-ExtraLight.ttf'),
    'Ro-bold': require('./assets/fonts/RobotoCondensed-Bold.ttf'),
    'Ro-semi-bold': require('./assets/fonts/RobotoCondensed-SemiBold.ttf'),
    'Ro-medium': require('./assets/fonts/RobotoCondensed-Medium.ttf'),
    'Ro-light': require('./assets/fonts/RobotoCondensed-Light.ttf'),
  });
  
  const [initializing, setInitializing] = useState(true);

  // Initialize app state
  useEffect(() => {
    const initializeApp = async () => {
      if (!fontsLoaded) return;
      
      try {
        // Check onboarding status
        const onboarded = await getOnboardingStatus();
        dispatch(setOnboarded(onboarded));
        
        // Check auth status
        const savedAuth = await getAuthData();
        if (savedAuth) {
          dispatch(setAuth(savedAuth));
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
      
      setInitializing(false);
    };
    
    initializeApp();
  }, [fontsLoaded]);

  // Handle Firebase auth state changes
  useEffect(() => {
    if (!fontsLoaded || initializing) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          let authData = {
            uid: user.uid,
            email: user.email,
            role: 'user',
            userData: null
          };
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            authData = {
              ...authData,
              role: userData.role || 'user',
              userData: userData
            };
          }
          
          // Save to Redux and AsyncStorage
          dispatch(setAuth(authData));
          await saveAuthData(authData);
          
          // Navigate based on role
          if (authData.role === 'admin' || authData.role === 'shopkeeper') {
            router.replace('/(tabs)/_admin-home');
          } else if (authData.role === 'super-admin') {
            router.replace('/(tabs)/_super-admin-home');
          } else {
            // For regular users, go to user-specific tabs
            router.replace('/(user)/home');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          dispatch(clearAuth());
          await clearAuthData();
          router.replace('/auth/login');
        }
      } else {
        dispatch(clearAuth());
        await clearAuthData();
        // Only redirect to login if onboarding is completed
        if (hasOnboarded) {
          router.replace('/auth/login');
        }
      }
    });

    return () => unsubscribe();
  }, [fontsLoaded, initializing, hasOnboarded]);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    dispatch(setOnboarded(true));
    await saveOnboardingStatus(true);
  };
  
  if (!fontsLoaded || initializing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" translucent={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!hasOnboarded) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" translucent={true} />
        <OnboardingScreen onboardingComplete={handleOnboardingComplete} />
      </SafeAreaView>
    );
  }
  
  // If we reach here, we're either logged in (handled by auth listener) 
  // or need to show login (handled by auth listener)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent={true} />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});

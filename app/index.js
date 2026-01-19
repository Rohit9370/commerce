import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

// OPTIMIZED FOR FAST STARTUP:
// - Redux PersistGate rehydrates immediately from AsyncStorage cache
// - restoreSession() returns cached auth data without Firebase calls
// - Font loading happens in parallel with auth restoration
// - Navigation fires as soon as fonts + Redux are ready
// Expected startup time: 1-2 seconds (down from 4-5 seconds)

const Index = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  // Redux selectors
  const { hasOnboarded } = useSelector((state) => state.onboarding);
  const { uid, role, isAuthenticated, ready } = useSelector(
    (state) => state.auth,
  );

  const [fontsLoaded] = useFonts({
    "Ro-reg": require("./assets/fonts/RobotoCondensed-ExtraLight.ttf"),
    "Ro-bold": require("./assets/fonts/RobotoCondensed-Bold.ttf"),
    "Ro-semi-bold": require("./assets/fonts/RobotoCondensed-SemiBold.ttf"),
    "Ro-medium": require("./assets/fonts/RobotoCondensed-Medium.ttf"),
    "Ro-light": require("./assets/fonts/RobotoCondensed-Light.ttf"),
  });

  const [initializing, setInitializing] = useState(true);

  // Initialize app - Fast path: use Redux persisted state immediately
  // No need to check AsyncStorage again - Redux persist handles it
  useEffect(() => {
    // Fonts loaded and auth ready = initialization complete
    // This happens almost instantly from Redux cache
    if (fontsLoaded && ready) {
      setInitializing(false);
    }
  }, [fontsLoaded, ready]);

  // Handle navigation based on auth and onboarding status
  useEffect(() => {
    if (!fontsLoaded || initializing || !ready) return;

    const handleNavigation = () => {
      // If user is authenticated
      if (isAuthenticated && uid) {
        // Navigate based on role
        if (role === "admin" || role === "shopkeeper") {
          router.replace("/(tabs)/_admin-home");
        } else if (role === "super-admin") {
          router.replace("/(tabs)/_super-admin-home");
        } else {
          router.replace("/(user)/home");
        }
      } else if (hasOnboarded) {
        // User has completed onboarding but not logged in
        router.replace("/auth/login");
      } else {
        // First time user - show onboarding
        router.replace("/onboarding");
      }
    };

    handleNavigation();
  }, [
    fontsLoaded,
    initializing,
    ready,
    isAuthenticated,
    uid,
    role,
    hasOnboarded,
    router,
  ]);

  if (!fontsLoaded || initializing || !ready) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default Index;

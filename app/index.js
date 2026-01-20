import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

const Index = () => {
  const router = useRouter();
  const { hasOnboarded } = useSelector((state) => state.onboarding);
  const { uid, role, isAuthenticated, ready } = useSelector((state) => state.auth);

  const [fontsLoaded] = useFonts({
    "Ro-reg": require("./assets/fonts/RobotoCondensed-ExtraLight.ttf"),
    "Ro-bold": require("./assets/fonts/RobotoCondensed-Bold.ttf"),
    "Ro-semi-bold": require("./assets/fonts/RobotoCondensed-SemiBold.ttf"),
    "Ro-medium": require("./assets/fonts/RobotoCondensed-Medium.ttf"),
    "Ro-light": require("./assets/fonts/RobotoCondensed-Light.ttf"),
  });

  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (fontsLoaded && ready) {
      const timer = setTimeout(() => {
        setInitializing(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, ready]);

  useEffect(() => {
    if (!fontsLoaded || initializing || !ready) return;

    console.log('Index.js - Navigation check:', {
      isAuthenticated,
      uid,
      role,
      hasOnboarded,
      fontsLoaded,
      initializing,
      ready
    });

    const handleNavigation = () => {
      if (isAuthenticated && uid) {
        console.log('User is authenticated, navigating based on role:', role);
        
        if (role === "admin" || role === "shopkeeper") {
          router.replace("/(tabs)/_admin-home");
        } else if (role === "super-admin") {
          router.replace("/(tabs)/_super-admin-home");
        } else {
          router.replace("/(user)/home");
        }
      } else if (hasOnboarded) {
        console.log('User has onboarded but not authenticated, going to login');
        router.replace("/auth/login");
      } else {
        console.log('First time user, going to onboarding');
        router.replace("/onboarding");
      }
    };

    const navigationTimer = setTimeout(handleNavigation, 500);
    return () => clearTimeout(navigationTimer);
  }, [fontsLoaded, initializing, ready, isAuthenticated, uid, role, hasOnboarded, router]);

  if (!fontsLoaded || initializing || !ready) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Starting App...</Text>
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

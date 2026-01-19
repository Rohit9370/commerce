import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { colors } from "../src/constants/theme";
import { persistor, store } from "../store";
import { restoreSession } from "../store/slices/authSlice";

function RootInner() {
  const dispatch = useDispatch();
  const { ready, isAuthenticated } = useSelector((state) => state.auth);
  const { hasOnboarded } = useSelector((state) => state.onboarding);
  const [initAttempted, setInitAttempted] = useState(false);

  useEffect(() => {
    // Initialize only once, on mount
    if (!initAttempted) {
      // Restore session - optimized to use cache immediately
      dispatch(restoreSession());
      setInitAttempted(true);
    }
  }, [dispatch]);

  // Wait for app to be ready
  if (!ready) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center",
        backgroundColor: colors.background 
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="bookings" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="services" />
        <Stack.Screen name="providers" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <PersistGate
            loading={
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#0000ff" />
              </View>
            }
            persistor={persistor}
          >
            <RootInner />
          </PersistGate>
        </Provider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

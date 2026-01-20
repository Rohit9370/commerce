import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { colors } from "../../src/constants/theme";
import TypographyComponents from "../Components/TypographyComponents";

function Icon({ name, focused, color }) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={name} size={focused ? 26 : 24} color={color} />
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { role } = useSelector((state) => state.auth);

  const spinsRef = useRef(
    state.routes.reduce((acc, r) => {
      acc[r.key] = new Animated.Value(0);
      return acc;
    }, {}),
  );

  const onPress = (route, idx, isFocused) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
   
      const v = spinsRef.current[route.key];
      v.setValue(0);
      Animated.timing(v, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
      navigation.navigate(route.name);
    }
  };


  const getVisibleRoutes = () => {
    return state.routes.filter(route => {
      const { options } = descriptors[route.key];
      
      if (options?.href === null) return false;
 
      if (role === 'user') {
       
        return ['index', 'services', 'bookings', 'profile'].includes(route.name);
      } else if (role === 'admin' || role === 'shopkeeper') {
      
        return ['_admin-home', '_admin-services', 'bookings', 'profile'].includes(route.name);
      } else if (role === 'super-admin') {
  
        return ['_super-admin-home', '_admin-services', 'bookings', 'profile'].includes(route.name);
      }
      
      return false;
    });
  };

  const visibleRoutes = getVisibleRoutes();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.fabWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <BlurView
        intensity={80}
        tint={Platform.OS === "ios" ? "systemMaterial" : "light"}
        style={styles.tabContainer}
      >
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const routeIndex = state.routes.findIndex(r => r.key === route.key);
          
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;
                
          const isFocused = state.index === routeIndex;
          const color = isFocused ? colors.primary : colors.gray[500];
          
          const spin =
            spinsRef.current[route.key]?.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "360deg"],
            }) || "0deg";

          const iconName = getIconName(route.name, isFocused);

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={() => onPress(route, routeIndex, isFocused)}
              style={styles.tabItem}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Icon name={iconName} focused={isFocused} color={color} />
              </Animated.View>
              <TypographyComponents 
                font="medium"
                size="sm"
                other={`${isFocused ? 'text-blue-600' : 'text-gray-500'} text-center`}
              >
                {getTabLabel(route.name)}
              </TypographyComponents>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

function getIconName(routeName, focused) {
  const iconMap = {
    'index': focused ? 'home' : 'home-outline',
    '_admin-home': focused ? 'business' : 'business-outline',
    '_super-admin-home': focused ? 'shield-checkmark' : 'shield-checkmark-outline',
    'services': focused ? 'grid' : 'grid-outline',
    '_admin-services': focused ? 'construct' : 'construct-outline',
    'bookings': focused ? 'calendar' : 'calendar-outline',
    'profile': focused ? 'person' : 'person-outline',
  };
  return iconMap[routeName] || 'ellipse-outline';
}

function getTabLabel(routeName) {
  const labelMap = {
    'index': 'Home',
    '_admin-home': 'Dashboard',
    '_super-admin-home': 'Admin',
    'services': 'Services',
    '_admin-services': 'Services',
    'bookings': 'Bookings', // For users: "My Bookings", For shopkeepers: "Booking Requests"
    'profile': 'Profile',
  };
  return labelMap[routeName] || routeName;
}

export default function TabLayout() {
  const { role } = useSelector((state) => state.auth);

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* User Home Screen */}
      <Tabs.Screen
        name="index"
        options={{
          href: role === 'user' ? '/index' : null,
        }}
      />
      
      {/* Admin/Shopkeeper Screens */}
      <Tabs.Screen
        name="_admin-home"
        options={{
          href: (role === 'admin' || role === 'shopkeeper') ? '/_admin-home' : null,
        }}
      />
      
      {/* Super Admin Screens */}
      <Tabs.Screen
        name="_super-admin-home"
        options={{
          href: role === 'super-admin' ? '/_super-admin-home' : null,
        }}
      />
      
      {/* Common Screens */}
      <Tabs.Screen
        name="services"
        options={{
          href: role === 'user' ? '/services' : null,
        }}
      />
      
      <Tabs.Screen
        name="_admin-services"
        options={{
          href: (role === 'admin' || role === 'shopkeeper' || role === 'super-admin') ? '/_admin-services' : null,
        }}
      />
      
      <Tabs.Screen
        name="bookings"
        options={{
          href: '/bookings',
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          href: '/profile',
        }}
      />

      {/* Hidden screens */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="home-user" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 24,
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  iconContainer: {
    marginBottom: 2,
  },
});
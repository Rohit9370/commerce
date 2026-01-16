import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useRef } from 'react';
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserRole } from '../../hooks/useUserRole';

function Icon({ name, focused, color }) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={name} size={focused ? 26 : 24} color={color} />
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  // rotation anim per route key
  const spinsRef = useRef(
    state.routes.reduce((acc, r) => {
      acc[r.key] = new Animated.Value(0);
      return acc;
    }, {})
  );

  const onPress = (route, idx, isFocused) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      // spin animation on press
      const v = spinsRef.current[route.key];
      v.setValue(0);
      Animated.timing(v, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      navigation.navigate(route.name);
    }
  };

  return (
    <View pointerEvents="box-none" style={[styles.fabWrap, { paddingBottom: Math.max(insets.bottom, 12) }] }>
      <BlurView intensity={30} tint={Platform.OS === 'ios' ? 'systemMaterial' : 'light'} style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          // hide screens with href: null (expo-router)
          if (options?.href === null) return null;
          const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
          const isFocused = state.index === index;
          const color = isFocused ? '#111827' : '#6b7280';
          const spin = spinsRef.current[route.key]?.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) || '0deg';

          const iconName =
            route.name === 'index' ? (isFocused ? 'home' : 'home-outline') :
            route.name === 'services' ? (isFocused ? 'briefcase' : 'briefcase-outline') :
            route.name === 'bookings' ? (isFocused ? 'calendar' : 'calendar-outline') :
            route.name === 'profile' ? (isFocused ? 'person' : 'person-outline') :
            route.name === 'notifications' ? (isFocused ? 'notifications' : 'notifications-outline') : 'ellipse';

          return (
            <TouchableOpacity key={route.key} accessibilityRole="button" activeOpacity={0.9} onPress={() => onPress(route, index, isFocused)} style={styles.tabItem}>
              <Animated.View style={[styles.pill, isFocused && styles.pillActive, { transform: [{ rotate: spin }] }] }>
                <Ionicons name={iconName} size={isFocused ? 22 : 20} color={color} />
              </Animated.View>
              {options.tabBarShowLabel !== false && (
                <TextLabel focused={isFocused} text={label} />
              )}
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

function TextLabel({ focused, text }) {
  return (
    <Animated.Text numberOfLines={1} style={[styles.label, { color: focused ? '#111827' : '#6b7280' }]}>
      {text}
    </Animated.Text>
  );
}

export default function TabLayout() {
  const { userRole } = useUserRole();

  const isAdmin = userRole === 'admin' || userRole === 'shopkeeper';
  const isSuperAdmin = userRole === 'super-admin';
  const isUser = userRole === 'user' || !userRole;

  const commonScreenOptions = {
    headerShown: false,
    tabBarShowLabel: true,
    // For user role, hide native tab bar (we'll render a custom one inside user screens)
    tabBarStyle: isUser ? { display: 'none' } : { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
    tabBar: isUser ? undefined : (props) => <CustomTabBar {...props} />,
  };

  // Define all possible screens
  const userScreens = [
    <Tabs.Screen
      key="user-bookings"
      name="bookings"
      options={{
        title: 'My Bookings',
        tabBarIcon: ({ color, focused }) => (
          <Icon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} color={color} />
        ),
      }}
    />,
    <Tabs.Screen
      key="user-profile"
      name="profile"
      options={{
        title: 'Profile',
        tabBarIcon: ({ color, focused }) => (
          <Icon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} />
        ),
      }}
    />,
    <Tabs.Screen key="user-notifications" name="notifications" options={{ href: null }} />
  ];

  const adminScreens = [
    <Tabs.Screen
      key="admin-services"
      name="services"
      options={{
        title: 'My Services',
        tabBarIcon: ({ color, focused }) => (
          <Icon name={focused ? 'briefcase' : 'briefcase-outline'} focused={focused} color={color} />
        ),
      }}
    />,
    <Tabs.Screen
      key="admin-bookings"
      name="bookings"
      options={{
        title: 'Requests',
        tabBarIcon: ({ color, focused }) => (
          <Icon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} color={color} />
        ),
      }}
    />,
    <Tabs.Screen
      key="admin-profile"
      name="profile"
      options={{
        title: 'Profile',
        tabBarIcon: ({ color, focused }) => (
          <Icon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} />
        ),
      }}
    />
  ];

  const superAdminScreens = [
    <Tabs.Screen
      key="super-services"
      name="services"
      options={{
        title: 'Manage',
        tabBarIcon: ({ color, focused }) => (
          <Icon name={focused ? 'settings' : 'settings-outline'} focused={focused} color={color} />
        ),
      }}
    />,
    <Tabs.Screen
      key="super-bookings"
      name="bookings"
      options={{
        title: 'Requests',
        tabBarIcon: ({ color, focused }) => (
          <Icon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} color={color} />
        ),
      }}
    />,
    <Tabs.Screen
      key="super-profile"
      name="profile"
      options={{
        title: 'Profile',
        tabBarIcon: ({ color, focused }) => (
          <Icon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} />
        ),
      }}
    />
  ];

  // Select screens based on role
  const roleScreens = isUser ? userScreens : isAdmin ? adminScreens : superAdminScreens;

  return (
    <Tabs screenOptions={commonScreenOptions}>
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: isSuperAdmin ? 'Admin' : isAdmin ? 'Dashboard' : 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />
          ),
        }}
      />

      {/* Role-specific screens */}
      {roleScreens}

      {/* Hidden routes */}
      <Tabs.Screen name="_admin-home" options={{ href: null }} />
      <Tabs.Screen name="_admin-services" options={{ href: null }} />
      <Tabs.Screen name="_super-admin-home" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    width: 42,
  },
  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  pill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pillActive: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
  },
});

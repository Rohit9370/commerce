import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserRole } from '../../hooks/useUserRole';
import ErrorBoundary from '../Components/ErrorBoundary';

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  // Safety check for state and descriptors
  if (!state || !descriptors || !navigation) {
    console.warn('CustomTabBar: Missing required props');
    return null;
  }

  if (!state.routes || state.routes.length === 0) {
    console.warn('CustomTabBar: No routes available');
    return null;
  }

  try {
    return (
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {state.routes.map((route, index) => {
          if (!route || !route.key) {
            console.warn('CustomTabBar: Invalid route at index', index);
            return null;
          }

          const { options } = descriptors[route.key] || {};
          if (!options) {
            console.warn('CustomTabBar: No options for route', route.key);
            return null;
          }

          const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            try {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            } catch (error) {
              console.error('Error in tab press:', error);
            }
          };

          const getIconName = (routeName, focused) => {
            switch (routeName) {
              case 'home':
                return focused ? 'home' : 'home-outline';
              case 'bookings':
                return focused ? 'calendar' : 'calendar-outline';
              case 'profile':
                return focused ? 'person' : 'person-outline';
              default:
                return 'ellipse-outline';
            }
          };

          return (
            <TouchableOpacity key={route.key} style={styles.tabItem} onPress={onPress}>
              <View style={[styles.tabButton, isFocused && styles.tabButtonActive]}>
                <Ionicons
                  name={getIconName(route.name, isFocused)}
                  size={isFocused ? 24 : 22}
                  color={isFocused ? '#4F46E5' : '#9CA3AF'}
                />
              </View>
              <Text style={[styles.tabLabel, { color: isFocused ? '#4F46E5' : '#9CA3AF' }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  } catch (error) {
    console.error('Error rendering CustomTabBar:', error);
    return null;
  }
}

export default function UserTabLayout() {
  const router = useRouter();
  const { userRole, loading, userData } = useUserRole();

  // Enhanced authentication check
  useEffect(() => {
    if (!loading) {
      console.log('UserTabLayout - Auth check:', { 
        userRole, 
        hasUserData: !!userData,
        uid: userData?.uid,
        isAuthenticated: !!userData?.uid 
      });
      
      // Strict authentication check - must have userData with uid
      if (!userData?.uid) {
        console.log('No authenticated user - redirecting to login');
        router.replace('/auth/login');
        return;
      }
      
      // Role-based redirect for non-users
      if (userRole && userRole !== 'user') {
        console.log('Wrong role for user layout - redirecting based on role:', userRole);
        if (userRole === 'admin' || userRole === 'shopkeeper') {
          router.replace('/(tabs)/_admin-home');
        } else if (userRole === 'super-admin') {
          router.replace('/(tabs)/_super-admin-home');
        }
        return;
      }
    }
  }, [loading, userData, userRole, router]);

  // Show nothing while loading or if no authenticated user
  if (loading || !userData?.uid) {
    return null;
  }

  // Don't render if wrong role
  if (userRole && userRole !== 'user') {
    return null;
  }

  return (
    <ErrorBoundary>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen 
          name="home" 
          options={{ 
            title: 'Home',
            tabBarLabel: 'Home'
          }} 
        />
        <Tabs.Screen 
          name="bookings" 
          options={{ 
            title: 'Bookings',
            tabBarLabel: 'Bookings'
          }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{ 
            title: 'Profile',
            tabBarLabel: 'Profile'
          }} 
        />
      </Tabs>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabButtonActive: {
    backgroundColor: '#EEF2FF',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
import React, { useMemo, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';

const ROUTES = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'bookings', label: 'Bookings', icon: 'calendar' },
  { name: 'profile', label: 'Profile', icon: 'person' },
];

export default function UserBottomBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  const active = useMemo(() => {
    if (pathname?.includes('/bookings')) return 'bookings';
    if (pathname?.includes('/profile')) return 'profile';
    return 'index';
  }, [pathname]);

  const spins = useRef(
    ROUTES.reduce((acc, r) => {
      acc[r.name] = new Animated.Value(0);
      return acc;
    }, {})
  ).current;

  const onPress = (r) => {
    if (r.name === active) return;
    const v = spins[r.name];
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    router.replace(`/(${r.name === 'index' ? 'tabs' : 'tabs'})/${r.name === 'index' ? '' : r.name}`.replace('/(tabs)//','/(tabs)/'));
    if (r.name === 'index') router.replace('/(tabs)/');
    if (r.name === 'bookings') router.replace('/(tabs)/bookings');
    if (r.name === 'profile') router.replace('/(tabs)/profile');
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }] }>
      <BlurView intensity={30} tint={Platform.OS === 'ios' ? 'systemMaterial' : 'light'} style={styles.container}>
        {ROUTES.map((r) => {
          const focused = active === r.name;
          const color = focused ? '#111827' : '#6b7280';
          const spin = spins[r.name].interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
          return (
            <TouchableOpacity key={r.name} onPress={() => onPress(r)} activeOpacity={0.9} style={styles.item}>
              <Animated.View style={[styles.pill, focused && styles.pillActive, { transform: [{ rotate: spin }] }] }>
                <Ionicons name={focused ? r.icon : `${r.icon}-outline`} size={focused ? 22 : 20} color={color} />
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  item: { alignItems: 'center', justifyContent: 'center', minWidth: 64 },
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
});

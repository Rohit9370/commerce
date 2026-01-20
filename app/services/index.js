import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserRole } from '../../hooks/useUserRole';

export default function ServicesIndexScreen() {
  const router = useRouter();
  const { userRole, loading } = useUserRole();

  useEffect(() => {
    if (!loading && userRole) {
      // Redirect based on user role
      if (userRole === 'user') {
        router.replace('/(user)/home'); // Users see services on home page
      } else if (userRole === 'admin' || userRole === 'shopkeeper') {
        router.replace('/(tabs)/_admin-services');
      } else {
        router.replace('/(tabs)/services');
      }
    }
  }, [userRole, loading]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});
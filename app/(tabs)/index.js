import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserRole } from '../../hooks/useUserRole';
import SuperAdminHomeScreen from '../(super-admin)/home';
import AdminHomeScreen from '../(admin)/home';
import UserHomeScreen from '../(user)/home';

export default function HomeScreen() {
  const { userRole, userData, loading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (userRole === 'super-admin') {
    return <SuperAdminHomeScreen />;
  }

  if (userRole === 'admin' || userRole === 'shopkeeper') {
    return (
      <SafeAreaView style={styles.container}>
        <AdminHomeScreen userData={userData} />
      </SafeAreaView>
    );
  }

  // default: normal user
  return (
    <SafeAreaView style={styles.container}>
      <UserHomeScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

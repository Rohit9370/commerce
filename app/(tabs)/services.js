import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserRole } from '../../hooks/useUserRole';
import TypographyComponents from '../Components/TypographyComponents';
import AdminServicesScreen from './_admin-services';

export default function ServicesScreen() {
  const { userRole, loading } = useUserRole();

  if (userRole === 'admin' || userRole === 'shopkeeper') {
    return <AdminServicesScreen />;
  }

  const services = [
    { id: 1, name: 'Plumbing', description: 'Professional plumbing services', price: '$50/hr', rating: 4.8 },
    { id: 2, name: 'Electrical Work', description: 'Electrical installation and repair', price: '$60/hr', rating: 4.9 },
    { id: 3, name: 'Cleaning', description: 'Home and office cleaning', price: '$30/hr', rating: 4.7 },
    { id: 4, name: 'Painting', description: 'Interior and exterior painting', price: '$45/hr', rating: 4.6 },
  ];

  const renderService = ({ item }) => (
    <TouchableOpacity style={styles.serviceCard}>
      <View style={styles.serviceRow}>
        <View style={styles.serviceIconPlaceholder} />
        <View style={styles.serviceDetails}>
          <TypographyComponents size="lg" font="bold" other="text-gray-800">
            {item.name}
          </TypographyComponents>
          <TypographyComponents size="sm" font="reg" other="text-gray-600">
            {item.description}
          </TypographyComponents>
          <View style={styles.serviceMeta}>
            <TypographyComponents size="md" font="bold" other="text-indigo-600">
              {item.price}
            </TypographyComponents>
            <Text style={styles.rating}>⭐ {item.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TypographyComponents size="2xl" font="bold" other="text-gray-800">
          Available Services
        </TypographyComponents>
        <TypographyComponents size="md" font="reg" other="text-gray-600 mt-1">
          Browse services near you
        </TypographyComponents>
      </View>
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
  },
  serviceCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconPlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
  },
  serviceDetails: {
    flex: 1,
  },
  serviceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '500',
  },
});
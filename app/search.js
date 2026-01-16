import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const services = [
    { id: 1, name: 'Plumbing', description: 'Professional plumbing services', price: '$50/hr', rating: 4.8, provider: 'John\'s Plumbing' },
    { id: 2, name: 'Electrical Work', description: 'Electrical installation and repair', price: '$60/hr', rating: 4.9, provider: 'Mike\'s Electric' },
    { id: 3, name: 'Cleaning', description: 'Home and office cleaning', price: '$30/hr', rating: 4.7, provider: 'Clean Home Pro' },
    { id: 4, name: 'Painting', description: 'Interior and exterior painting', price: '$45/hr', rating: 4.6, provider: 'Pro Painters' },
    { id: 5, name: 'AC Repair', description: 'Air conditioning repair and maintenance', price: '$55/hr', rating: 4.9, provider: 'Cool Air Services' },
    { id: 6, name: 'Carpentry', description: 'Woodwork and carpentry services', price: '$40/hr', rating: 4.5, provider: 'Craft Wood Works' },
  ];


  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popularCategories = [
    { name: 'Plumbing', icon: '🔧' },
    { name: 'Electrician', icon: '💡' },
    { name: 'Cleaning', icon: '🧹' },
    { name: 'Painting', icon: '🎨' },
    { name: 'AC Repair', icon: '❄️' },
    { name: 'Carpentry', icon: '🪚' },
  ];

  const renderService = ({ item }) => (
    <TouchableOpacity 
      style={styles.serviceCard}
      onPress={() => router.push(`/services/${item.id}`)}
    >
      <View style={styles.serviceRow}>
        <View style={styles.serviceImagePlaceholder} />
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceProvider}>{item.provider}</Text>
          <Text style={styles.serviceDescription}>{item.description}</Text>
          <View style={styles.serviceBottomRow}>
            <Text style={styles.servicePrice}>{item.price}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.rating}>{item.rating}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => setSearchQuery(item.name)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Popular Categories</Text>
          <FlatList
            horizontal
            data={popularCategories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.name}
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesList}
          />
          
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>Services</Text>
            <Text style={styles.resultsCount}>{filteredServices.length} results</Text>
          </View>
          
          <FlatList
            data={filteredServices}
            renderItem={renderService}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchHeader: {
    backgroundColor: 'white',
    padding: 16,
  },
  searchContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  categoriesList: {
    marginBottom: 24,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsCount: {
    color: '#6b7280',
  },
  categoryCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: 4,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    textAlign: 'center',
    fontSize: 14,
  },
  serviceCard: {
    backgroundColor: 'white',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceImagePlaceholder: {
    backgroundColor: '#e5e7eb',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    width: 64,
    height: 64,
  },
  serviceInfo: {
    marginLeft: 16,
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
  },
  serviceProvider: {
    color: '#6b7280',
  },
  serviceDescription: {
    color: '#6b7280',
    fontSize: 14,
  },
  serviceBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  servicePrice: {
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    color: '#eab308',
  },
  rating: {
    color: '#374151',
    marginLeft: 4,
  },
});
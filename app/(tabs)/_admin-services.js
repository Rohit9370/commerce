import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TypographyComponents from '../Components/TypographyComponents';

export default function AdminServicesScreen() {
  const [services, setServices] = useState([
    { id: 1, name: 'Basic Service', price: '$50', description: 'Basic service description', active: true },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '', description: '' });

  const handleAddService = () => {
    if (!newService.name || !newService.price) {
      Alert.alert('Error', 'Please fill in service name and price');
      return;
    }
    
    const service = {
      id: services.length + 1,
      ...newService,
      active: true,
    };
    
    setServices([...services, service]);
    setNewService({ name: '', price: '', description: '' });
    setShowAddForm(false);
    Alert.alert('Success', 'Service added successfully');
  };

  const toggleService = (id) => {
    setServices(services.map(s => 
      s.id === id ? { ...s, active: !s.active } : s
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TypographyComponents size="2xl" font="bold" other="text-gray-800">
            Manage Services
          </TypographyComponents>
          <TypographyComponents size="md" font="reg" other="text-gray-600 mt-1">
            Add and manage your shop services
          </TypographyComponents>
        </View>

        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={styles.addButtonText}>
            {showAddForm ? '✕ Cancel' : '+ Add New Service'}
          </Text>
        </TouchableOpacity>

        {showAddForm && (
          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              placeholder="Service Name"
              value={newService.name}
              onChangeText={(text) => setNewService({ ...newService, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Price (e.g., $50)"
              value={newService.price}
              onChangeText={(text) => setNewService({ ...newService, price: text })}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={newService.description}
              onChangeText={(text) => setNewService({ ...newService, description: text })}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleAddService}
            >
              <Text style={styles.submitButtonText}>Add Service</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.servicesList}>
          <TypographyComponents size="lg" font="medium" other="text-gray-800 mb-4">
            Your Services ({services.length})
          </TypographyComponents>
          
          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <TypographyComponents size="lg" font="bold" other="text-gray-800">
                    {service.name}
                  </TypographyComponents>
                  <TypographyComponents size="md" font="medium" other="text-indigo-600">
                    {service.price}
                  </TypographyComponents>
                  {service.description && (
                    <TypographyComponents size="sm" font="reg" other="text-gray-600 mt-1">
                      {service.description}
                    </TypographyComponents>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.toggleButton, service.active && styles.toggleButtonActive]}
                  onPress={() => toggleService(service.id)}
                >
                  <Text style={styles.toggleText}>
                    {service.active ? '✓ Active' : '○ Inactive'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  servicesList: {
    marginTop: 8,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceInfo: {
    flex: 1,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleButtonActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
});

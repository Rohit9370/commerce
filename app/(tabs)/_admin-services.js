import { Ionicons } from '@expo/vector-icons';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useUserRole } from '../../hooks/useUserRole';
import { selectAuth } from '../../store';
import { db } from '../services/firebaseconfig';

export default function AdminServicesScreen() {
  const { userData } = useUserRole();
  const { uid } = useSelector(selectAuth);
  const dispatch = useDispatch();
  
  const [services, setServices] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '', description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (userData && userData.services) {
      setServices(userData.services);
    }
    setLoading(false);
  }, [userData]);

  const handleAddService = async () => {
    if (!newService.name || !newService.price) {
      Alert.alert('Error', 'Please fill in service name and price');
      return;
    }
    
    try {

      if (uid) {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, {
          services: arrayUnion({
            id: Date.now(),
            name: newService.name,
            price: newService.price,
            description: newService.description,
            active: true,
            createdAt: new Date(),
          })
        });
        
     
        const newServiceObj = {
          id: Date.now(),
          name: newService.name,
          price: newService.price,
          description: newService.description,
          active: true,
          createdAt: new Date(),
        };
        
        setServices([...services, newServiceObj]);
        setNewService({ name: '', price: '', description: '' });
        setShowAddForm(false);
        Alert.alert('Success', 'Service added successfully');
      }
    } catch (error) {
      console.error('Error adding service:', error);
      Alert.alert('Error', 'Failed to add service. Please try again.');
    }
  };

  const toggleService = async (serviceId) => {
    try {
      if (uid) {
        const userDocRef = doc(db, 'users', uid);
        const serviceIndex = services.findIndex(s => s.id === serviceId);
        if (serviceIndex !== -1) {
          const updatedServices = [...services];
          updatedServices[serviceIndex] = {
            ...updatedServices[serviceIndex],
            active: !updatedServices[serviceIndex].active
          };
        
          await updateDoc(userDocRef, {
            services: updatedServices
          });
          
          setServices(updatedServices);
        }
      }
    } catch (error) {
      console.error('Error toggling service:', error);
      Alert.alert('Error', 'Failed to update service status. Please try again.');
    }
  };

  const deleteService = async (serviceId) => {
    try {
      if (uid) {
        const userDocRef = doc(db, 'users', uid);
        const serviceToDelete = services.find(s => s.id === serviceId);
        
        if (serviceToDelete) {
          await updateDoc(userDocRef, {
            services: arrayRemove(serviceToDelete)
          });
          
          setServices(services.filter(s => s.id !== serviceId));
          Alert.alert('Success', 'Service deleted successfully');
        }
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      Alert.alert('Error', 'Failed to delete service. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Manage Services</Text>
          <Text style={styles.headerSubtitle}>Add and manage your shop services</Text>
        </View>

        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Ionicons name={showAddForm ? 'close' : 'add'} size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>
            {showAddForm ? 'Cancel' : 'Add New Service'}
          </Text>
        </TouchableOpacity>

        {showAddForm && (
          <View style={styles.formCard}>
            <Text style={styles.label}>Service Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Haircut, Massage, etc."
              value={newService.name}
              onChangeText={(text) => setNewService({ ...newService, name: text })}
            />
            
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., ₹200"
              value={newService.price}
              onChangeText={(text) => setNewService({ ...newService, price: text })}
            />
            
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief description of the service"
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

        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Your Services ({services.length})</Text>
          
          {services.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No services yet</Text>
              <Text style={styles.emptySubtitle}>Add your first service to get started</Text>
            </View>
          ) : (
            services.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceContent}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.servicePrice}>{service.price}</Text>
                    {service.description && (
                      <Text style={styles.serviceDescription}>{service.description}</Text>
                    )}
                  </View>
                  
                  <View style={styles.serviceActions}>
                    <TouchableOpacity
                      style={[styles.statusToggle, service.active && styles.statusToggleActive]}
                      onPress={() => toggleService(service.id)}
                    >
                      <Text style={styles.statusText}>
                        {service.active ? 'Active' : 'Inactive'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => Alert.alert(
                        'Delete Service', 
                        'Are you sure you want to delete this service?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteService(service.id) }
                        ]
                      )}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  servicesSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceContent: {
    padding: 16,
  },
  serviceInfo: {
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4f46e5',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  serviceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  statusToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusToggleActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  deleteButton: {
    padding: 6,
  },
});

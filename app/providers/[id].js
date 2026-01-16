import { View, Text, TouchableOpacity, ScrollView, Image, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ServiceProviderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  // Sample provider data - in a real app this would come from your API
  const providerData = {
    id: 1,
    name: 'John\'s Plumbing Experts',
    rating: 4.8,
    reviews: 124,
    description: 'Professional plumbing services with over 10 years of experience. We offer 24/7 emergency services and guarantee satisfaction.',
    contact: '+1 (555) 123-4567',
    location: 'Downtown Area',
    hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-4PM',
    services: [
      { id: 1, name: 'Pipe Repair', price: '$50/hr', duration: '1 hour' },
      { id: 2, name: 'Leak Detection', price: '$75/hr', duration: '1 hour' },
      { id: 3, name: 'Water Heater Installation', price: '$150/hr', duration: '2 hours' },
      { id: 4, name: 'Drain Cleaning', price: '$60/hr', duration: '1 hour' },
      { id: 5, name: 'Fixture Installation', price: '$80/hr', duration: '1.5 hours' }
    ],
    images: [
      'https://placehold.co/400x300?text=Service+Image+1',
      'https://placehold.co/400x300?text=Service+Image+2',
      'https://placehold.co/400x300?text=Service+Image+3',
    ],
    certifications: ['Licensed Plumber', 'Certified Installer', 'Emergency Response']
  };

  const renderService = ({ item }) => (
    <TouchableOpacity 
      className="bg-white p-4 m-2 rounded-lg shadow-sm border border-gray-100"
      onPress={() => router.push(`/services/${item.id}`)}
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-lg font-semibold">{item.name}</Text>
          <Text className="text-gray-600 text-sm">Duration: {item.duration}</Text>
        </View>
        <View className="bg-indigo-100 px-3 py-1 rounded-full">
          <Text className="text-indigo-700 font-semibold">{item.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="relative">
        <Image 
          source={{ uri: providerData.images[0] }} 
          className="w-full h-64"
          style={{ resizeMode: 'cover' }}
        />
        
        <TouchableOpacity 
          className="absolute top-12 left-4 bg-white p-2 rounded-full shadow-md"
          onPress={() => router.back()}
        >
          <Text className="text-xl">←</Text>
        </TouchableOpacity>
      </View>
      
      <View className="bg-white rounded-t-3xl -mt-8 pt-6 px-6 pb-8">
        <View className="items-center mb-6">
          <View className="bg-gray-200 border-2 border-dashed rounded-full w-24 h-24" />
          <Text className="text-2xl font-bold text-gray-800 mt-3">{providerData.name}</Text>
          
          <View className="flex-row items-center mt-2">
            <Text className="text-yellow-500 text-xl">★</Text>
            <Text className="ml-1 text-gray-700 font-medium">{providerData.rating}</Text>
            <Text className="text-gray-500 ml-2">({providerData.reviews} reviews)</Text>
          </View>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800">About</Text>
          <Text className="text-gray-600 mt-2">{providerData.description}</Text>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800">Services Offered</Text>
          <FlatList
            data={providerData.services}
            renderItem={renderService}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
          />
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800">Certifications</Text>
          <View className="mt-2 flex-wrap flex-row">
            {providerData.certifications.map((cert, index) => (
              <View key={index} className="bg-green-100 rounded-full px-3 py-1 mr-2 mb-2">
                <Text className="text-green-700 text-sm">{cert}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800">Contact Info</Text>
          <View className="mt-2 bg-gray-50 p-4 rounded-lg">
            <Text className="text-gray-700"><Text className="font-medium">Phone:</Text> {providerData.contact}</Text>
            <Text className="text-gray-700 mt-1"><Text className="font-medium">Location:</Text> {providerData.location}</Text>
            <Text className="text-gray-700 mt-1"><Text className="font-medium">Hours:</Text> {providerData.hours}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          className="bg-indigo-500 py-4 rounded-xl items-center"
          onPress={() => router.push(`/bookings/new?serviceId=1&serviceName=${providerData.name}`)}
        >
          <Text className="text-white font-bold text-lg">Book a Service</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
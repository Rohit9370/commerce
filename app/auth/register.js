import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import { setAuth } from "../../store/slices/authSlice";
import { setOnboarded } from "../../store/slices/onboardingSlice";
import { saveAuthData, saveOnboardingStatus } from "../../utils/authStorage";
import TypographyComponents from "../Components/TypographyComponents";
import { auth, db } from "../services/firebaseconfig";



const CameraGalleryOptions = ({
  visible,
  onClose,
  onCameraPress,
  onGalleryPress,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={onCameraPress}>
            <Ionicons name="camera-outline" size={24} color="#1E232C" />
            <Text style={styles.optionText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={onGalleryPress}
          >
            <Ionicons name="images-outline" size={24} color="#1E232C" />
            <Text style={styles.optionText}>Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// 90+ Categories List
const categoryList = [
  "Tailor",
  "food stole",
  "Parlour",
  "Mehendi Artist",
  "Barber Shop",
  "Salon",
  "Spa",
  "Electrician",
  "Plumber",
  "Clinic",
  "Dentist",
  "Medical Store",
  "Gym",
  "Yoga Center",
  "Cafe",
  "Bakery",
  "Grocery Store",
  "Pet Shop",
  "Laundry",
  "Car Wash",
  "Mechanic",
  "Photographer",
  "Music Teacher",
  "Tutor",
].sort();

const daysList = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const Registration = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [selectedRole, setSelectedRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // User States
  const [fullName, setFullName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [userCoords, setUserCoords] = useState(null);

  // Shop States
  const [ownerName, setOwnerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopCoords, setShopCoords] = useState(null);
  const [shopImages, setShopImages] = useState([]); // Multiple Images
  const [shopVideo, setShopVideo] = useState(null); // Shop Video
  const [selectedCat, setSelectedCat] = useState("");
  const [offDays, setOffDays] = useState([]); // Multiple Closing Days
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState([{ name: "", price: "", description: "" }]); // Services array with description

  // Modal & Time Picker States
  const [catModal, setCatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openTime, setOpenTime] = useState(new Date());
  const [closeTime, setCloseTime] = useState(new Date());
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showCameraGalleryModal, setShowCameraGalleryModal] = useState(false);

  const uploadToCloudinary = async (uri) => {
    const timestamp = Date.now();
    const uploadPreset = "your_upload_preset";
    const formData = new FormData();
    formData.append("file", { uri, type: "image/jpeg", name: "upload.jpg" });
    formData.append("timestamp", timestamp);
    formData.append("upload_preset", uploadPreset);

    formData.append("upload_preset", "serviceprovider");
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/dvvii6ei6/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await res.json();
      if (data.secure_url) {
        console.log("Image uploaded to Cloudinary:", data.secure_url);
        return data.secure_url;
      } else {
        console.log("Cloudinary upload error:", data);
        return null;
      }
    } catch (e) {
      console.log("Cloudinary upload error:", e);
      return null;
    }
  };

  const uploadVideoToCloudinary = async (uri) => {

    const timestamp = Date.now();

    const formData = new FormData();
    formData.append("file", { uri, type: "video/mp4", name: "upload.mp4" });
    formData.append("timestamp", timestamp);
    formData.append("upload_preset", "serviceprovider"); 

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/dvvii6ei6/video/upload`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await res.json();
      if (data.secure_url) {
        console.log("Video uploaded to Cloudinary:", data.secure_url);
        return data.secure_url;
      } else {
        console.log("Cloudinary video upload error:", data);
        return null;
      }
    } catch (e) {
      console.log("Cloudinary video upload error:", e);
      return null;
    }
  };

  const handleLocation = async (forUser = false) => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission Denied");
    setLoading(true);
    let loc = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };

    if (forUser) {
      setUserCoords(coords);
      let rev = await Location.reverseGeocodeAsync(loc.coords);
      if (rev.length > 0) {
        const addr = `${rev[0].name || ""}, ${rev[0].city}, ${rev[0].region}`;
        setUserAddress(addr);
      }
    } else {
      setShopCoords(coords);
      let rev = await Location.reverseGeocodeAsync(loc.coords);
      if (rev.length > 0) {
        const addr = `${rev[0].name || ""}, ${rev[0].city}, ${rev[0].region}`;
        setShopAddress(addr);
      }
    }

    setLoading(false);
  };

  const pickImagesFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.6,
    });
    if (!result.canceled)
      setShopImages([...shopImages, ...result.assets.map((a) => a.uri)]);
  };

  const takePhoto = async () => {
    
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take photos",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled) {
      setShopImages([...shopImages, result.assets[0].uri]);
    }
  };

  const toggleOffDay = (day) => {
    setOffDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const pickVideo = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Media library permission is required to select videos",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      
      if (asset.duration > 90) {
        Alert.alert(
          "Video Too Long",
          "Please select a video that is 1.5 minutes (90 seconds) or shorter.",
        );
        return;
      }

      setShopVideo(asset.uri);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) return setError("Email/Password required");

    if (selectedRole === "user" && (!fullName || !userPhone)) {
      return setError("Please fill all user details");
    }

    if (
      selectedRole === "shopkeeper" &&
      (!ownerName || !shopName || !shopPhone || !shopAddress || !shopCoords || !selectedCat || !experience || !description || services.some(s => !s.name || !s.price))
    ) {
      return setError("Please fill all shop details including services");
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      console.log("User created with UID:", userCred.user.uid);

      const uploadedUrls = await Promise.all(
        shopImages.map((uri) => uploadToCloudinary(uri)),
      );
      console.log("Uploaded image URLs:", uploadedUrls);

      const uploadedVideoUrl = shopVideo
        ? await uploadVideoToCloudinary(shopVideo)
        : null;
      console.log("Uploaded video URL:", uploadedVideoUrl);

      const userData = {
        uid: userCred.user.uid,
        email,
        role: selectedRole,
        isActive: true,
        ...(selectedRole === "user"
          ? {
              fullName,
              phone: userPhone,
              address: userAddress,
              location: userCoords,
            }
          : {
              ownerName,
              shopName,
              shopPhone,
              category: selectedCat,
              offDays,
              location: shopCoords,
              address: shopAddress,
              shopImages: uploadedUrls,
              shopVideo: uploadedVideoUrl,
              experience,
              description,
              services: services.filter(s => s.name && s.price), 
              timing: {
                open: openTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                close: closeTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
              rating: 0,
              totalBookings: 0,
              isVerified: false,
            }),
      };

      console.log("Attempting to save user data:", userData);
      console.log("User UID:", userCred.user.uid);

      if (userCred && userCred.user && userCred.user.uid) {
     
        const userDocRef = doc(db, "users", userCred.user.uid);
        await setDoc(userDocRef, userData);
        console.log("User data saved successfully");


        const savedDoc = await getDoc(userDocRef);
        if (savedDoc.exists()) {
          console.log("Verified: User data exists in Firestore");
        } else {
          console.log("Warning: User data does not exist after saving");
        }

     
        dispatch(setOnboarded(true));
        await saveOnboardingStatus(true);

        const authData = {
          uid: userCred.user.uid,
          email: userCred.user.email,
          role: selectedRole,
          userData: userData,
        };
e
        dispatch(setAuth(authData));
        await saveAuthData(authData);
      } else {
        console.log("Invalid user credentials");
        throw new Error("Invalid user credentials");
      }
     
      if (selectedRole === "admin" || selectedRole === "shopkeeper") {
        router.replace("/(tabs)/_admin-home");
      } else if (selectedRole === "super-admin") {
        router.replace("/(tabs)/_super-admin-home");
      } else {
        router.replace("/(user)/home");
      }
    } catch (err) {
      console.log("Error during registration:", err);
      console.log("Error code:", err.code);
      console.log("Error message:", err.message);
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
   
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1E232C" />
          </TouchableOpacity>
          <TypographyComponents
            size="3xl"
            font="bold"
            other="flex-1 text-center"
          >
            Create Account
          </TypographyComponents>
        </View>

        {/* Role Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setSelectedRole("user")}
            style={[styles.tab, selectedRole === "user" && styles.activeTab]}
          >
            <Text style={selectedRole === "user" && styles.activeTabText}>
              User
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedRole("shopkeeper")}
            style={[
              styles.tab,
              selectedRole === "shopkeeper" && styles.activeTab,
            ]}
          >
            <Text style={selectedRole === "shopkeeper" && styles.activeTabText}>
              Service Provider
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {selectedRole === "shopkeeper" ? (
            <>
              <Text style={styles.inputLabel}>Owner/Manager Name</Text>
              <TextInput
                placeholder="Enter owner/manager name"
                style={styles.input}
                onChangeText={setOwnerName}
              />

              <Text style={styles.inputLabel}>Shop Name</Text>
              <TextInput
                placeholder="Enter shop name"
                style={styles.input}
                onChangeText={setShopName}
              />

              <Text style={styles.inputLabel}>Shop Contact Number</Text>
              <TextInput
                placeholder="Enter contact number"
                keyboardType="phone-pad"
                style={styles.input}
                onChangeText={setShopPhone}
              />

              {/* Searchable Category Picker Trigger */}
              <TouchableOpacity
                style={styles.pickerBox}
                onPress={() => setCatModal(true)}
              >
                <Text style={{ color: selectedCat ? "#1F2937" : "#9CA3AF" }}>
                  {selectedCat || "Search & Select Category"}
                </Text>
                <Ionicons name="search-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Time Pickers */}
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.timeBtn}
                  onPress={() => setShowOpen(true)}
                >
                  <Text style={styles.timeLabel}>
                    Opens At:{" "}
                    {openTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.timeBtn}
                  onPress={() => setShowClose(true)}
                >
                  <Text style={styles.timeLabel}>
                    Closes At:{" "}
                    {closeTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Weekly Off Days Picker */}
              <Text style={styles.sectionTitle}>Weekly Closing Days</Text>
              <View style={styles.daysContainer}>
                {daysList.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayChip,
                      offDays.includes(day) && styles.activeDayChip,
                    ]}
                    onPress={() => toggleOffDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        offDays.includes(day) && styles.activeDayText,
                      ]}
                    >
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Location */}
              <TouchableOpacity
                style={styles.locationBtn}
                onPress={() => handleLocation(false)}
              >
                <Ionicons
                  name="location"
                  size={20}
                  color={shopCoords ? "#6366F1" : "#fff"}
                />
                <Text style={styles.locationBtnText}>
                  {shopAddress || "Detect Shop Location"}
                </Text>
              </TouchableOpacity>

              {/* Experience */}
              <Text style={styles.inputLabel}>Years of Experience</Text>
              <TextInput
                placeholder="e.g., 5 years"
                style={styles.input}
                onChangeText={setExperience}
                keyboardType="numeric"
              />

              {/* Description */}
              <Text style={styles.inputLabel}>Shop Description</Text>
              <TextInput
                placeholder="Describe your services and expertise"
                style={[styles.input, styles.textArea]}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              {/* Services */}
              <Text style={styles.sectionTitle}>Services & Pricing</Text>
              {services.map((service, index) => (
                <View key={index} style={styles.serviceContainer}>
                  <View style={styles.serviceRow}>
                    <TextInput
                      placeholder="Service name"
                      style={[styles.input, { flex: 2, marginRight: 10 }]}
                      value={service.name}
                      onChangeText={(text) => {
                        const newServices = [...services];
                        newServices[index].name = text;
                        setServices(newServices);
                      }}
                    />
                    <TextInput
                      placeholder="Price range"
                      style={[styles.input, { flex: 1 }]}
                      value={service.price}
                      onChangeText={(text) => {
                        const newServices = [...services];
                        newServices[index].price = text;
                        setServices(newServices);
                      }}
                    />
                    {services.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeServiceBtn}
                        onPress={() => {
                          const newServices = services.filter((_, i) => i !== index);
                          setServices(newServices);
                        }}
                      >
                        <Ionicons name="close" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput
                    placeholder="Service description (optional)"
                    style={[styles.input, styles.serviceDescription]}
                    value={service.description || ''}
                    onChangeText={(text) => {
                      const newServices = [...services];
                      newServices[index].description = text;
                      setServices(newServices);
                    }}
                    multiline
                    numberOfLines={2}
                  />
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.addServiceBtn}
                onPress={() => setServices([...services, { name: "", price: "", description: "" }])}
              >
                <Ionicons name="add" size={20} color="#6366F1" />
                <Text style={styles.addServiceText}>Add Another Service</Text>
              </TouchableOpacity>

              {/* Multiple Image Preview */}
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={() => setShowCameraGalleryModal(true)}
              >
                <Ionicons name="camera-outline" size={30} color="#9CA3AF" />
                <Text style={{ color: "#9CA3AF" }}>Add Shop Photos</Text>
              </TouchableOpacity>

              {/* Camera/Gallery Options Modal */}
              <CameraGalleryOptions
                visible={showCameraGalleryModal}
                onClose={() => setShowCameraGalleryModal(false)}
                onCameraPress={takePhoto}
                onGalleryPress={pickImagesFromGallery}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexDirection: "row", marginTop: 10 }}
              >
                {shopImages.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.thumb} />
                ))}
              </ScrollView>

              {/* Video Upload Section */}
              <TouchableOpacity style={styles.videoPicker} onPress={pickVideo}>
                <Ionicons name="videocam-outline" size={30} color="#9CA3AF" />
                <Text style={{ color: "#9CA3AF" }}>Add Shop Video</Text>
              </TouchableOpacity>

              {shopVideo && (
                <View style={styles.videoPreviewContainer}>
                  <Video
                    source={{ uri: shopVideo }}
                    rate={1.0}
                    volume={1.0}
                    isMuted={false}
                    resizeMode="cover"
                    shouldPlay={false}
                    isLooping={false}
                    style={styles.videoPreview}
                  />
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                placeholder="Enter your full name"
                style={styles.input}
                onChangeText={setFullName}
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                style={styles.input}
                onChangeText={setUserPhone}
              />

              {/* User Location */}
              <TouchableOpacity
                style={styles.locationBtn}
                onPress={() => handleLocation(true)}
              >
                <Ionicons
                  name="location"
                  size={20}
                  color={userCoords ? "#6366F1" : "#fff"}
                />
                <Text style={styles.locationBtnText}>
                  {userAddress || "Detect My Location"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            placeholder="Enter your email"
            style={styles.input}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            placeholder="Enter your password"
            style={styles.input}
            secureTextEntry
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.mainBtn}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.mainBtnText}>Register Now</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Category Search Modal */}
        <Modal visible={catModal} animationType="slide">
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TextInput
                placeholder="Search Category..."
                style={styles.searchBar}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity onPress={() => setCatModal(false)}>
                <Text style={{ color: "red" }}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={categoryList.filter((c) =>
                c.toLowerCase().includes(searchQuery.toLowerCase()),
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.catItem}
                  onPress={() => {
                    setSelectedCat(item);
                    setCatModal(false);
                  }}
                >
                  <Text style={styles.catText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Modal>

        {/* Time Pickers (Spinner Mode) */}
        {showOpen && (
          <DateTimePicker
            value={openTime}
            mode="time"
            display="spinner"
            onChange={(e, d) => {
              setShowOpen(false);
              if (d) setOpenTime(d);
            }}
          />
        )}
        {showClose && (
          <DateTimePicker
            value={closeTime}
            mode="time"
            display="spinner"
            onChange={(e, d) => {
              setShowClose(false);
              if (d) setCloseTime(d);
            }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  scrollContainer: { paddingHorizontal: 25, paddingBottom: 50, paddingTop: 20 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 6,
    marginBottom: 25,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 12 },
  activeTab: { backgroundColor: "#FFFFFF", elevation: 2 },
  activeTabText: { fontWeight: "700", color: "#1E232C" },
  form: { gap: 15 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 18,
    fontSize: 15,
  },
  pickerBox: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  row: { flexDirection: "row", gap: 10 },
  timeBtn: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6366F1",
  },
  timeLabel: { fontSize: 13, color: "#6366F1", fontWeight: "600" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4B5563",
    marginTop: 5,
  },
  daysContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeDayChip: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  activeDayText: { color: "#fff", fontWeight: "bold" },
  locationBtn: {
    backgroundColor: "#1E232C",
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  locationBtnText: { color: "#fff", fontWeight: "600" },
  imagePicker: {
    height: 100,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  videoPicker: {
    height: 100,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#6366F1",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  thumb: { width: 70, height: 70, borderRadius: 12, marginRight: 10 },
  videoPreviewContainer: { marginTop: 10, alignItems: "center" },
  videoPreview: { width: 200, height: 150, borderRadius: 12 },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceDescription: {
    marginTop: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  removeServiceBtn: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
  },
  addServiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366F1',
    borderStyle: 'dashed',
    marginTop: 10,
  },
  addServiceText: {
    color: '#6366F1',
    fontWeight: '600',
    marginLeft: 8,
  },
  mainBtn: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  mainBtnText: {
    color: "#6366F1",
    fontWeight: "800",
    fontSize: 16,
    textAlign: "center",
  },
  errorText: { color: "red", textAlign: "center" },
  // Modal Styles
  modalContent: { flex: 1, padding: 25, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 40,
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 12,
  },
  catItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  catText: { fontSize: 16 },
  // Camera/Gallery Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 15,
    color: "#1E232C",
  },
  cancelButton: {
    padding: 15,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginTop: 10,
  },
  cancelText: { fontSize: 16, fontWeight: "600", color: "#EF4444" },
});

export default Registration;

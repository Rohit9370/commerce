import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Swiper from 'react-native-swiper';
import { useDispatch } from 'react-redux';
import { setOnboardingComplete, setOnboardingStart } from '../store/slices/onboardingSlice';
import { saveOnboardingStatus } from '../utils/authStorage';
import TypographyComponents from './Components/TypographyComponents';


const { width, height } = Dimensions.get('window');


const scale = (size) => {
  const guidelineBaseWidth = 375; 
  return (width / guidelineBaseWidth) * size;
};

const scaleVertical = (size) => {
  const guidelineBaseHeight = 812; 
  return (height / guidelineBaseHeight) * size;
};

const OnboardingScreen = ({ onboardingComplete }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const swiperRef = useRef(null);
  const [index, setIndex] = useState(0);

  const handleSkip = async () => {
    try {

      dispatch(setOnboardingStart());
      dispatch(setOnboardingComplete());
      await saveOnboardingStatus(true);
      
      if (onboardingComplete) {
        onboardingComplete();
      }
      router.push('/auth/login');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleNext = async () => {
    if (index < 2) {
      swiperRef.current.scrollBy(1);
    } else {
      try {
   
        dispatch(setOnboardingStart());
        dispatch(setOnboardingComplete());
        await saveOnboardingStatus(true);
        
        if (onboardingComplete) {
          onboardingComplete();
        }
        router.push('/auth/login');
      } catch (error) {
        console.error('Error completing onboarding:', error);
      }
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.topBar}>
        <TouchableOpacity 
          onPress={handleSkip}
          style={styles.skipButton}
        >
          <TypographyComponents 
            font="medium" 
            size="sm" 
            other="text-blue-600"
            center={true}
          >
            Skip
          </TypographyComponents>
        </TouchableOpacity>
      </View>

      <Swiper
        ref={swiperRef}
        loop={false}
        onIndexChanged={(idx) => setIndex(idx)}
        activeDotColor="#000002"
        dotColor="#afb8d7"
        paginationStyle={{ bottom: scaleVertical(100) }}  
      >

        <View style={styles.slideContainer}>
          <View style={styles.imageContainer}>
           
            <Image 
              style={styles.image}
              
              resizeMode='contain' 
              source={require('./assets/pngs/mangae_your_business.png')} 
            />
          </View>
          <View style={styles.textContainer}>
            <TypographyComponents size="3xl" font="medium" other='text-center p-2'>
              Get Your Business Online
            </TypographyComponents>
            <TypographyComponents 
              font="reg" 
              size="md" 
              other="text-gray-600 text-center leading-6 mt-2.5"
            >
              Connect with customers and grow your business with our platform
            </TypographyComponents>
          </View>
        </View>

        <View style={styles.slideContainer}>
           <View style={styles.imageContainer}>
             <Image 
              style={styles.image}
              resizeMode='contain' 
              source={require('./assets/pngs/serching_shops.png')} 
            />
           </View>
           <View style={styles.textContainer}>
            <TypographyComponents size="3xl" font="medium" other='text-center p-2'>
              Search Shops Nearby
            </TypographyComponents>
            <TypographyComponents 
              font="reg" 
              size="md" 
              other="text-gray-600 text-center leading-6 mt-2.5"
            >
              Find local services and shops near your location easily
            </TypographyComponents>
          </View>
        </View>

        <View style={styles.slideContainer}>
           <View style={styles.imageContainer}>
             {/* Yahan teesri image/svg lagayein */}
             <Image 
              style={styles.image}
              resizeMode='contain' 
              source={require('./assets/pngs/undraw_online-profile_v9c1.png')} 
            />
           </View>
           <View style={styles.textContainer}>
            <TypographyComponents size="3xl" font="medium" other='text-center p-2'>
              Book & Chat Instantly
            </TypographyComponents>
            <TypographyComponents 
              font="reg" 
              size="md" 
              other="text-gray-600 text-center leading-6 mt-2.5"
            >
              Book services and chat with providers in real-time
            </TypographyComponents>
          </View>
        </View>
      </Swiper>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          onPress={handleNext}
          style={styles.button}
        >
          <TypographyComponents 
            font="bold" 
            size="lg" 
            other="text-center"
            center={true}
          >
            {index === 2 ? 'Get Started' : 'Next'}
          </TypographyComponents>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  topBar: {
    position: 'absolute',
    top: scale(16),
    left: scale(20),
    right: scale(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  languageSelector: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  skipButton: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
  },
  slideContainer: {
    flex: 1,
  },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    height: height > 700 ? '80%' : '70%',
    width: width > 400 ? '60%' : '80%',
  },
  textContainer: {
    flex: 0.4,
    paddingHorizontal: scale(32), 
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection:"row",
    justifyContent: 'center',
    alignContent: 'center',
    position: 'absolute',
    bottom: scaleVertical(32), 
    width: '100%',
  },
  button: {
    backgroundColor: '#6366f1', 
    width: width > 400 ? '70%' : '80%',
    paddingVertical: scaleVertical(16), 
    paddingHorizontal: scale(16),
    borderRadius: scale(16), 
    alignSelf: 'center',
    marginHorizontal: scale(20),
  },
});

export default OnboardingScreen;
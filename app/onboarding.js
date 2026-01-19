import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Swiper from 'react-native-swiper';
import { useDispatch } from 'react-redux';
import { setOnboardingComplete, setOnboardingStart } from '../store/slices/onboardingSlice';
import { saveOnboardingStatus } from '../utils/authStorage';
import TypographyComponents from './Components/TypographyComponents';


const { width, height } = Dimensions.get('window');

// Responsive scaling function
const scale = (size) => {
  const guidelineBaseWidth = 375; // iPhone X width
  return (width / guidelineBaseWidth) * size;
};

const scaleVertical = (size) => {
  const guidelineBaseHeight = 812; // iPhone X height
  return (height / guidelineBaseHeight) * size;
};

const OnboardingScreen = ({ onboardingComplete }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const swiperRef = useRef(null);
  const [index, setIndex] = useState(0);

  const handleSkip = async () => {
    try {
      // Save onboarding status to both AsyncStorage and Redux
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
        // Save onboarding status to both AsyncStorage and Redux
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
              Setup your profile in minutes and showcase your services to thousands of customers.
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
              Find the best local experts and products right in your neighborhood on a live map.
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
              Ready to start? Book your favorite services and chat directly with experts.
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
            other="text-white"
            center={true}
          >
            {index === 2 ? "Get Started" : "Next"}
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
  skipButton: {
    position: 'absolute',
    top: scale(16),
    right: scale(20),
    zIndex: 10,
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
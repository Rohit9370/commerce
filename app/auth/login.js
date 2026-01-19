import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useDispatch } from 'react-redux';
import { setAuthFailure, setAuthStart, setAuthSuccess } from '../../store/slices/authSlice';
import { saveAuthData } from '../../utils/authStorage';
import TypographyComponents from '../Components/TypographyComponents';
import { auth, db } from '../services/firebaseconfig';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('user');
  const [error, setError] = useState('');


  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '735847697694-40k79l2t666m7n4284q5n939t9527v4o.apps.googleusercontent.com',
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your credentials');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Read actual role from Firestore and validate against selectedRole tab
      const snap = await getDoc(doc(db, 'users', userCredential.user.uid));

      let effectiveRole = 'user';
      let userData = null;
      if (snap.exists()) {
        const data = snap.data();
        effectiveRole = (data.role || 'user');
        userData = data;
      }
      
      // Prepare auth data
      const authData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role: effectiveRole,
        userData: userData
      };
      
      // Save to AsyncStorage and Redux
      dispatch(setAuthStart());
      const saveSuccess = await saveAuthData(authData);
      if (saveSuccess) {
        dispatch(setAuthSuccess(authData));
      } else {
        dispatch(setAuthFailure('Failed to save auth data'));  
      }

      // Map 'service provider' selection to our roles (admin/shopkeeper)
      const isProviderRole = (r) => r === 'admin' || r === 'shopkeeper';
      const sel = selectedRole; // 'user' | 'shopkeeper' | 'admin'

      // Enforce match between selected and actual role per your rule:
      // - If selected 'user' but actual is provider → error
      // - If selected 'shopkeeper' but actual is user → error
      // - If selected 'admin' but actual is not admin (super-admin allowed as admin) → error
      if (sel === 'user' && isProviderRole(effectiveRole)) {
        setError('This account is registered as a Service Provider. Please switch to Service Provider or Admin tab.');
        setLoading(false);
        return;
      }
      if (sel === 'shopkeeper' && !isProviderRole(effectiveRole)) {
        setError('This account is not a Service Provider. Please switch to User tab.');
        setLoading(false);
        return;
      }
      if (sel === 'admin' && !(effectiveRole === 'admin' || effectiveRole === 'super-admin')) {
        setError('This account does not have Admin access.');
        setLoading(false);
        return;
      }

      // Navigate into tabs; role-specific home is chosen inside Home tab
      router.replace('/(tabs)/');
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Invalid email or password';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);
        const userCredential = await signInWithCredential(auth, credential);
        
        // Fetch user data from Firestore
        const snap = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        let effectiveRole = 'user';
        let userData = null;
        if (snap.exists()) {
          const data = snap.data();
          effectiveRole = (data.role || 'user');
          userData = data;
        }
        
        // Prepare auth data
        const authData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          role: effectiveRole,
          userData: userData
        };
        
        // Save to AsyncStorage and Redux
        dispatch(setAuthStart());
        const saveSuccess = await saveAuthData(authData);
        if (saveSuccess) {
          dispatch(setAuthSuccess(authData));
        } else {
          dispatch(setAuthFailure('Failed to save auth data'));  
        }
        
        router.replace('/(tabs)/');
      }
    } catch (err) {
      setError('Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Top Branding Area */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="flash" size={40} color="#6366F1" />
          </View>
          <TypographyComponents size="4xl" font="bold" other="text-gray-900 mt-6">
            Welcome Back
          </TypographyComponents>
          <TypographyComponents size="md" font="reg" other="text-gray-500 mt-1">
            Glad to see you again, login to continue!
          </TypographyComponents>
        </View>

        {/* Modern Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            onPress={() => setSelectedRole('user')}
            style={[styles.tab, selectedRole === 'user' && styles.activeTab]}
          >
            <Text style={[styles.tabText, selectedRole === 'user' && styles.activeTabText]}>User</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setSelectedRole('shopkeeper')}
            style={[styles.tab, selectedRole === 'shopkeeper' && styles.activeTab]}
          >
            <Text style={[styles.tabText, selectedRole === 'shopkeeper' && styles.activeTabText]}>Service Provider</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setSelectedRole('admin')}
            style={[styles.tab, selectedRole === 'admin' && styles.activeTab]}
          >
            <Text style={[styles.tabText, selectedRole === 'admin' && styles.activeTabText]}>Admin</Text>
          </TouchableOpacity>
        </View>

        {/* Input Fields */}
        <View style={styles.formContainer}>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={styles.forgotBtn}
            onPress={() => router.push('/auth/forgot-password')}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>Or Login with</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Image 
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }} 
              style={styles.googleIcon} 
            />
            <Text style={styles.googleButtonText}>Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account? {' '}
            <Text style={styles.link} onPress={() => router.push('/auth/register')}>
              Register Now
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 25, paddingBottom: 40 },
  brandContainer: { marginTop: 70, alignItems: 'center' },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 6,
    marginTop: 40,
    marginBottom: 25,
    gap: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  activeTabText: { color: '#1F2937' },
  formContainer: { gap: 15 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 15, color: '#1F2937' },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 5 },
  forgotText: { color: '#6366F1', fontWeight: '600', fontSize: 13 },
  loginButton: {
    backgroundColor: '#1E232C',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 10, color: '#9CA3AF', fontSize: 13 },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  googleButtonText: { color: '#1F2937', fontWeight: '600', fontSize: 15 },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { color: '#1E232C', fontSize: 14 },
  link: { color: '#35C2C1', fontWeight: '700' },
  errorText: { color: '#EF4444', textAlign: 'center', fontSize: 13, marginTop: 5 }
});
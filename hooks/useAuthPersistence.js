import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { auth, db } from '../app/services/firebaseconfig';
import { clearAuth, setAuth, setAuthReady } from '../store/slices/authSlice';
import { clearAuthData, getAuthData, saveAuthData } from '../utils/authStorage';

export const useAuthPersistence = () => {
  const dispatch = useDispatch();
  const { uid, ready } = useSelector((state) => state.auth);

  useEffect(() => {
    let unsubscribe;
    
    const loadPersistedAuth = async () => {
      try {
        // First, try to get auth data from AsyncStorage
        const persistedAuthData = await getAuthData();
        
        if (persistedAuthData?.uid) {
          // We have persisted auth data, check if Firebase session is still valid
          // Set initial auth state while we wait for Firebase verification
          dispatch(setAuth(persistedAuthData));
          
          // Listen for auth state changes to verify session
          unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && user.uid === persistedAuthData.uid) {
              // User is authenticated, verify user data in Firestore
              try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  const authData = {
                    uid: user.uid,
                    email: user.email,
                    role: userData.role || 'user',
                    userData: {
                      ...userData,
                      uid: user.uid,
                      email: user.email
                    }
                  };
                  
                  // Update auth state with fresh data
                  dispatch(setAuth(authData));
                  
                  // Update persisted data in case of any changes
                  await saveAuthData(authData);
                }
              } catch (error) {
                console.error('Error verifying user data:', error);
              }
              
              // Mark auth as ready after verification
              dispatch(setAuthReady(true));
            } else {
              // User session is invalid, clear auth
              await clearAuthData();
              dispatch(clearAuth());
              dispatch(setAuthReady(true));
            }
          });
        } else {
          // No persisted auth data, just listen for auth state changes
          unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
              // User is logged in, fetch user data and persist it
              try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  const authData = {
                    uid: user.uid,
                    email: user.email,
                    role: userData.role || 'user',
                    userData: {
                      ...userData,
                      uid: user.uid,
                      email: user.email
                    }
                  };
                  
                  // Save to AsyncStorage and Redux
                  await saveAuthData(authData);
                  dispatch(setAuth(authData));
                }
              } catch (error) {
                console.error('Error fetching user data:', error);
                dispatch(clearAuth());
              }
            } else {
              // No user logged in
              dispatch(clearAuth());
            }
            
            // Mark auth as ready
            dispatch(setAuthReady(true));
          });
        }
      } catch (error) {
        console.error('Error loading persisted auth:', error);
        dispatch(clearAuth());
        dispatch(setAuthReady(true));
      }
    };

    loadPersistedAuth();
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dispatch]);

  return { authReady: ready };
};
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '../store';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../app/services/firebaseconfig';
import { useDispatch } from 'react-redux';
import { setAuth, clearAuth } from '../store/slices/authSlice';
import { onAuthStateChanged } from 'firebase/auth';

export function useUserRole() {
  const [userRole, setUserRole] = useState(null);
  const dispatch = useDispatch();
  const cachedAuth = useSelector(selectAuth);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Prime from persisted Redux to avoid loader flicker
  useEffect(() => {
    if (cachedAuth?.uid && cachedAuth?.role) {
      setUserRole(cachedAuth.role);
      setUserData(cachedAuth.userData || null);
      setUser({ uid: cachedAuth.uid, email: cachedAuth.email });
      setLoading(false);
    }
  }, [cachedAuth?.uid, cachedAuth?.role]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setUserRole(data.role || 'user'); // Default to 'user' if no role
            dispatch(setAuth({ uid: currentUser.uid, email: currentUser.email, role: data.role || 'user', userData: data }));
          } else {
            setUserRole('user'); // Default role
            setUserData(null);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user'); // Default on error
        }
      } else {
        setUserRole(null);
        setUserData(null);
        dispatch(clearAuth());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { userRole, userData, loading, user };
}

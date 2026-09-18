import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider, signInWithPopup, signOut } from "../firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import AuthErrorModal from "../components/AuthErrorModal";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          let userData = {
            uid: user.uid,
            name: user.displayName || "Treat Tracker Member",
            email: user.email,
            photoURL: user.photoURL || "",
            gender: "Not specified",
            bio: "",
            favoriteTreat: "",
            lastLogin: new Date().toISOString()
          };

          if (userSnap.exists()) {
            const existing = userSnap.data();
            userData = {
              ...userData,
              ...existing,
              uid: user.uid,
              email: user.email,
              name: existing.name || user.displayName || "Treat Tracker Member",
              photoURL: existing.photoURL || user.photoURL || "",
              lastLogin: new Date().toISOString()
            };
            await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
          } else {
            await setDoc(userRef, userData);
          }

          setCurrentUser(userData);
        } catch (error) {
          console.error("Error loading user profile:", error);
          // Fallback to basic auth user data if firestore query fails
          setCurrentUser({
            uid: user.uid,
            name: user.displayName || "Treat Tracker Member",
            email: user.email,
            photoURL: user.photoURL || "",
            gender: "Not specified",
            bio: "",
            favoriteTreat: ""
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateUserProfile = async (updates) => {
    if (!auth.currentUser) throw new Error("No authenticated user");
    const userRef = doc(db, "users", auth.currentUser.uid);
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Update Firestore
    await setDoc(userRef, updatedData, { merge: true });

    // Update Firebase Auth profile
    const authProfileUpdates = {};
    if (updates.name && updates.name !== auth.currentUser.displayName) {
      authProfileUpdates.displayName = updates.name;
    }
    if (updates.photoURL && updates.photoURL !== auth.currentUser.photoURL) {
      authProfileUpdates.photoURL = updates.photoURL;
    }

    if (Object.keys(authProfileUpdates).length > 0) {
      try {
        await updateProfile(auth.currentUser, authProfileUpdates);
      } catch (err) {
        console.warn("Could not update Firebase Auth profile display name/photo:", err);
      }
    }

    // Update local context reactively
    setCurrentUser(prev => ({
      ...prev,
      ...updatedData
    }));

    return true;
  };

  const loginWithGoogle = async () => {
    setIsLoggingIn(true);
    setAuthError(null);

    // Verify Firebase API key is configured
    if (!auth?.app?.options?.apiKey) {
      const msg = "Firebase API Key is missing! Please configure VITE_FIREBASE_API_KEY in your hosting dashboard and redeploy.";
      console.error(msg);
      setAuthError({
        type: 'CONFIG_MISSING',
        title: 'Firebase Config Missing',
        message: msg
      });
      setIsLoggingIn(false);
      return false;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      setIsLoggingIn(false);
      return result.user;
    } catch (error) {
      console.error("Google sign-in error:", error);
      setIsLoggingIn(false);

      if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setAuthError({
          type: 'UNAUTHORIZED_DOMAIN',
          title: 'Domain Not Authorized in Firebase',
          domain,
          message: `The domain "${domain}" is not authorized for Google Sign-In in your Firebase Console.`
        });
      } else if (error.code === 'auth/popup-blocked') {
        setAuthError({
          type: 'POPUP_BLOCKED',
          title: 'Popup Blocked by Browser',
          message: 'Your browser prevented the Google Sign-In popup from opening. Please enable popups for this site and try again.'
        });
      } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // User voluntarily closed the popup
        setAuthError(null);
      } else {
        setAuthError({
          type: 'AUTH_ERROR',
          title: 'Sign In Failed',
          message: error.message || 'An error occurred during authentication.'
        });
      }
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const value = {
    currentUser,
    updateUserProfile,
    loginWithGoogle,
    logout,
    isLoggingIn,
    authError,
    setAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      <AuthErrorModal error={authError} onClose={() => setAuthError(null)} />
    </AuthContext.Provider>
  );
};

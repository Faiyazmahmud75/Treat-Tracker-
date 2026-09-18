import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const value = {
    currentUser,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

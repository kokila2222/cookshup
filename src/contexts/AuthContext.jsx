import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import { auth } from "../firebase";

// Create the context
const AuthContext = createContext();

// Hook to use the context
export function useAuth() {
  return useContext(AuthContext);
}

// Context provider
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Signup and set display name
  function signup(email, password, displayName) {
    return createUserWithEmailAndPassword(auth, email, password)
      .then(({ user }) => {
        if (displayName) {
          return updateProfile(user, { displayName });
        }
      })
      .catch((error) => {
        switch (error.code) {
          case 'auth/email-already-in-use':
            throw new Error('Email already in use. Try logging in instead.');
          case 'auth/weak-password':
            throw new Error('Password should be at least 6 characters');
          case 'auth/invalid-email':
            throw new Error('Please enter a valid email address');
          default:
            console.error('Firebase signup error:', error.code, error.message);
            throw new Error(`Failed to create account: ${error.code || error.message}`);
        }
      });
  }

  // Login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password).catch((error) => {
      switch (error.code) {
        case 'auth/user-not-found':
          throw new Error('No account found with this email');
        case 'auth/wrong-password':
          throw new Error('Incorrect password');
        case 'auth/too-many-requests':
          throw new Error('Too many failed attempts. Try again later or reset your password.');
        default:
          throw new Error('Failed to log in. Please try again.');
      }
    });
  }

  // Logout
  function logout() {
    return signOut(auth);
  }

  // Update display name
  function updateDisplayName(displayName) {
    if (!auth.currentUser) return Promise.reject();
    return updateProfile(auth.currentUser, { displayName });
  }

  // Send reset password email
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Update password (optionally reauthenticate)
  async function updateUserPassword(newPassword, currentPassword = null) {
    if (!auth.currentUser) throw new Error("Not authenticated");

    if (currentPassword) {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
    }

    return updatePassword(auth.currentUser, newPassword);
  }

  // Delete account with re-authentication
  async function deleteAccount(password) {
    if (!auth.currentUser) throw new Error("Not authenticated");

    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      password
    );

    try {
      await reauthenticateWithCredential(auth.currentUser, credential);
      await deleteUser(auth.currentUser);
      return true;
    } catch (error) {
      switch (error.code) {
        case 'auth/wrong-password':
          throw new Error('Incorrect password');
        case 'auth/requires-recent-login':
          throw new Error('Please log in again to delete your account');
        default:
          throw new Error('Failed to delete account. Please try again.');
      }
    }
  }

  // Listen to auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    updateDisplayName,
    resetPassword,
    updateUserPassword,
    deleteAccount,
    loading, // Expose this!
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
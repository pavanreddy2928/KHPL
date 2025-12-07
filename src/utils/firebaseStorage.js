// Firebase Configuration for KHPL
// Free tier: 1GB storage, 50k connections/month

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, onValue } from 'firebase/database';

const firebaseConfig = {
  // Your Firebase config (free tier)
  apiKey: "your-api-key",
  authDomain: "khpl-app.firebaseapp.com",
  databaseURL: "https://khpl-app-default-rtdb.firebaseio.com",
  projectId: "khpl-app",
  storageBucket: "khpl-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export const saveRegistrationToFirebase = async (registrationData) => {
  try {
    const registrationsRef = ref(database, 'registrations');
    const newRegistrationRef = push(registrationsRef);
    await set(newRegistrationRef, {
      ...registrationData,
      timestamp: Date.now(),
      id: newRegistrationRef.key
    });
    return newRegistrationRef.key;
  } catch (error) {
    console.error('Firebase save error:', error);
    throw error;
  }
};

export const listenToRegistrations = (callback) => {
  const registrationsRef = ref(database, 'registrations');
  return onValue(registrationsRef, (snapshot) => {
    const data = snapshot.val();
    const registrations = data ? Object.values(data) : [];
    callback(registrations);
  });
};

// Install: npm install firebase
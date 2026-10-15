import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const clientConfig = {
  ...firebaseConfig,
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    firebaseConfig.apiKey,
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    firebaseConfig.appId,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    firebaseConfig.authDomain,
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ||
    firebaseConfig.measurementId,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    firebaseConfig.messagingSenderId,
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    firebaseConfig.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    firebaseConfig.storageBucket,
  firestoreDatabaseId:
    import.meta.env.VITE_FIRESTORE_DATABASE_ID ||
    firebaseConfig.firestoreDatabaseId,
};

const app = initializeApp(clientConfig);

export const db = getFirestore(
  app,
  clientConfig.firestoreDatabaseId
);

export const auth = getAuth(app);
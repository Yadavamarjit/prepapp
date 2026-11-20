import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const auth = getAuth(initializeApp(firebaseConfig));
export { onAuthStateChanged, signOut } from 'firebase/auth';

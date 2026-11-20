import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const auth = getAuth(initializeApp(firebaseConfig));
export { onIdTokenChanged, signOut } from 'firebase/auth';

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

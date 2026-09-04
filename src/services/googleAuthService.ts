import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { setCachedOAuthToken } from '../utils/googleSheets';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
// Google Calendar is enabled with the least-privileged scope needed to create,
// update and delete lesson events on the signed-in user's primary calendar.
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline'
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      setCachedOAuthToken('');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    setCachedOAuthToken(cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const isGoogleAuthorized = (): boolean => {
  return Boolean(cachedAccessToken || auth.currentUser);
};

export const getAuthStatus = (): { isAuthorized: boolean; user: User | null; email?: string } => {
  return {
    isAuthorized: Boolean(cachedAccessToken || auth.currentUser),
    user: auth.currentUser,
    email: auth.currentUser?.email || undefined
  };
};

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  setCachedOAuthToken('');
};

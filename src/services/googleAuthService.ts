import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { setCachedOAuthToken } from '../utils/googleSheets';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.setCustomParameters({
  prompt: 'consent'
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      cachedAccessToken = null;
      setCachedOAuthToken('');
      onAuthFailure?.();
      return;
    }

    // Firebase Auth is the identity authority. A Google OAuth access token is
    // only needed for Google APIs and is intentionally kept in memory.
    // Do not reject an otherwise valid Firebase session merely because the
    // short-lived Google API token is not currently cached.
    if (cachedAccessToken) {
      onAuthSuccess?.(user, cachedAccessToken);
      return;
    }

    try {
      // Refresh the Firebase ID token so callers can still establish an
      // authenticated session after a page reload. This does not create a
      // persistent Google OAuth access token.
      await user.getIdToken(true);
    } catch (error) {
      console.warn('Firebase session refresh failed:', error);
    }

    // Google API access requires an explicit Google sign-in flow. Keep the
    // Firebase user session valid while reporting that no API token is cached.
    onAuthSuccess?.(user, '');
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

export const getAccessToken = async (): Promise<string | null> => cachedAccessToken;

export const isGoogleAuthorized = (): boolean => Boolean(cachedAccessToken || auth.currentUser);

export const getAuthStatus = (): { isAuthorized: boolean; user: User | null; email?: string } => ({
  isAuthorized: Boolean(cachedAccessToken || auth.currentUser),
  user: auth.currentUser,
  email: auth.currentUser?.email || undefined
});

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  setCachedOAuthToken('');
};

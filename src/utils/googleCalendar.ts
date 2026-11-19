import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App if not already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Calendar scope
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const provider = new GoogleAuthProvider();
provider.addScope(CALENDAR_SCOPE);
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// CRITICAL: Cache access token in-memory ONLY. Do not store in localStorage or sessionStorage.
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
  status?: string;
}

/**
 * Initialize auth listener to keep UI in sync with user login state
 */
export const initCalendarAuth = (
  onAuthChange: (user: User | null, hasToken: boolean) => void
) => {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
      onAuthChange(null, false);
    } else {
      onAuthChange(user, Boolean(cachedAccessToken));
    }
  });
};

/**
 * Sign in with Google using popup and capture access token
 */
export const signInWithGoogleCalendar = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Calendar.');
    }

    cachedAccessToken = credential.accessToken;
    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    // Gracefully handle popup cancellation or closing by user without throwing an unhandled error
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup-closed-by-user') ||
      error?.message?.includes('cancelled-popup-request')
    ) {
      console.warn('Google Calendar: El usuario canceló o cerró la ventana emergente de inicio de sesión.');
      return null;
    }

    if (error?.code === 'auth/popup-blocked') {
      console.warn('Google Calendar: La ventana emergente fue bloqueada por el navegador.');
      throw new Error('El navegador bloqueó la ventana emergente. Por favor permite las ventanas emergentes en tu navegador.');
    }

    console.error('Error al conectar Google Calendar:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Sign out and clear in-memory token
 */
export const signOutGoogleCalendar = async (): Promise<void> => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
  } catch (error) {
    console.error('Error al desconectar Google Calendar:', error);
    cachedAccessToken = null;
  }
};

/**
 * Retrieve cached token
 */
export const getCalendarAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * List events from primary calendar
 */
export const fetchGoogleCalendarEvents = async (
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> => {
  if (!cachedAccessToken) {
    throw new Error('Google Calendar no está conectado. Por favor inicia sesión primero.');
  }

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.append('singleEvents', 'true');
  url.searchParams.append('orderBy', 'startTime');
  url.searchParams.append('maxResults', '50');

  if (timeMin) {
    url.searchParams.append('timeMin', timeMin);
  } else {
    // Default to start of current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    url.searchParams.append('timeMin', startOfMonth.toISOString());
  }

  if (timeMax) {
    url.searchParams.append('timeMax', timeMax);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      cachedAccessToken = null;
      throw new Error('La sesión de Google Calendar ha caducado. Por favor vuelve a conectar tu cuenta.');
    }
    throw new Error(errData?.error?.message || `Error al obtener eventos (${response.status})`);
  }

  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary || '(Sin título)',
    description: item.description || '',
    start: item.start || {},
    end: item.end || {},
    htmlLink: item.htmlLink,
    status: item.status,
  }));
};

/**
 * Create an event in primary calendar
 */
export const createGoogleCalendarEvent = async (eventData: {
  summary: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD
  allDay?: boolean;
}): Promise<GoogleCalendarEvent> => {
  if (!cachedAccessToken) {
    throw new Error('Google Calendar no está conectado. Por favor inicia sesión primero.');
  }

  const body: any = {
    summary: eventData.summary,
    description: eventData.description,
  };

  if (eventData.allDay !== false) {
    body.start = { date: eventData.startDate };
    // Google Calendar all-day end date is exclusive
    const nextDay = new Date(eventData.endDate || eventData.startDate);
    nextDay.setDate(nextDay.getDate() + 1);
    body.end = { date: nextDay.toISOString().split('T')[0] };
  } else {
    body.start = { dateTime: `${eventData.startDate}T09:00:00Z` };
    body.end = { dateTime: `${eventData.endDate || eventData.startDate}T18:00:00Z` };
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      cachedAccessToken = null;
      throw new Error('Token expirado. Vuelve a conectar tu cuenta de Google.');
    }
    throw new Error(errData?.error?.message || `Error al crear evento en Google Calendar (${response.status})`);
  }

  return await response.json();
};

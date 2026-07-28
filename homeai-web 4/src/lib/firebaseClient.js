import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
import { supabase } from "./supabaseClient.js";

// This is a DIFFERENT Firebase setup than the backend's — the backend uses
// a private service account key to SEND pushes; this is a small, public
// web config (safe to expose in frontend code, same as the Supabase anon
// key) used only to REGISTER this browser to RECEIVE them.
//
// Get these six values from Firebase Console → Project Settings → General
// → "Your apps" → Web app (add one if you haven't). The VAPID key comes
// from Project Settings → Cloud Messaging → Web configuration → "Generate
// key pair" — that one's separate from the other six.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Asks the browser for notification permission, registers this device with
// Firebase, and saves the resulting token onto the homeowner's profile so
// the backend knows where to send pushes. Returns a short status string so
// the calling UI can show something sensible either way — this always
// resolves, never throws, since "push isn't set up yet" shouldn't ever
// break the rest of the app.
export async function enablePushNotifications() {
  if (!firebaseConfig.apiKey) {
    return { ok: false, reason: "Push notifications aren't set up on this app yet." };
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { ok: false, reason: "This browser doesn't support push notifications." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: "Notifications were blocked — you can turn them on later in your browser's site settings." };
    }

    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    const swParams = new URLSearchParams(firebaseConfig).toString();
    const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swParams}`);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });

    if (!token) {
      return { ok: false, reason: "Could not get a notification token. Try again in a moment." };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("profiles").update({ push_token: token }).eq("id", user.id);
      if (error) return { ok: false, reason: `Got the token but couldn't save it: ${error.message}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message || "Something went wrong turning on notifications." };
  }
}

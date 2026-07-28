// Required by Firebase Web Push — must live at the site root (not under
// /src) so the browser can register it against the whole origin. Vite
// copies anything in /public to the build root unchanged, which is why
// this file lives there instead of alongside the rest of the app code.
//
// This can't read import.meta.env (service workers aren't bundled the same
// way regular app code is), so it receives its Firebase config as URL
// params instead — see the registration call in src/lib/firebaseClient.js.

importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

const params = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Shows a notification when a push arrives while the app isn't in the
// foreground. Foreground pushes (app open) are handled differently, inside
// the app itself, not here.
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "HomeAi", {
    body: body || "",
    icon: "/icon-192.png",
  });
});

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC7De_xFu7fqn5koTSNqGmEklZBeRb2YNo",
  authDomain: "adamjee-c9013.firebaseapp.com",
  projectId: "adamjee-c9013",
  storageBucket: "adamjee-c9013.firebasestorage.app",
  messagingSenderId: "87991048934",
  appId: "1:87991048934:web:381f4b2961a2fc46d27927"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // Ensure you have a logo.png in public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

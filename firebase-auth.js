// Firebase Authentication and minimal profile mapping for username login.
// Replace firebaseConfig values with your project's settings.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// Load Firebase compat scripts dynamically for GitHub Pages usage
(function loadFirebase() {
  const base = "https://www.gstatic.com/firebasejs/10.12.0/";
  const scripts = [
    base + "firebase-app-compat.js",
    base + "firebase-auth-compat.js",
    base + "firebase-database-compat.js"
  ];
  let loaded = 0;
  scripts.forEach(src => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => {
      loaded++;
      if (loaded === scripts.length) initAuth();
    };
    document.head.appendChild(s);
  });
})();

function initAuth() {
  // eslint-disable-next-line no-undef
  const app = firebase.initializeApp(firebaseConfig);
  // eslint-disable-next-line no-undef
  const auth = firebase.auth();
  // Persist session locally
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});

  // eslint-disable-next-line no-undef
  const db = firebase.database();

  // Expose helpers
  window.authOnReady = (cb) => {
    auth.onAuthStateChanged(user => cb(user || null));
  };

  window.authRequire = () => new Promise((resolve, reject) => {
    auth.onAuthStateChanged(user => user ? resolve(user) : reject(new Error('not-auth')));
  });

  window.firebaseSignOut = () => auth.signOut();

  // Signup: create user and store username mapping and profile
  window.firebaseSignup = async (email, username, password) => {
    // Firebase handles secure password storage (hashed)
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;
    // Save username mapping (prevent overwrite)
    const unameRef = db.ref(`/usernames/${username.toLowerCase()}`);
    const snap = await unameRef.get();
    if (snap.exists()) {
      // Username taken
      await cred.user.delete();
      throw new Error('username-taken');
    }
    await unameRef.set({ uid, email });
    await db.ref(`/profiles/${uid}`).set({ email, username, createdAt: Date.now() });
    return cred.user;
  };

  // Login: try email first, then username mapping
  window.firebaseLogin = async (ident, password) => {
    try {
      const cred = await auth.signInWithEmailAndPassword(ident, password);
      return cred.user;
    } catch (e) {
      // Try username lookup
      const snap = await db.ref(`/usernames/${ident.toLowerCase()}`).get();
      if (snap.exists()) {
        const email = snap.val().email;
        const cred = await auth.signInWithEmailAndPassword(email, password);
        return cred.user;
      }
      throw e;
    }
  };
}

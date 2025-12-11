// Firebase Realtime Database chat helpers.
// Requires firebase scripts loaded by firebase-auth.js

function initChat() {
  // eslint-disable-next-line no-undef
  const db = firebase.database();
  // eslint-disable-next-line no-undef
  const auth = firebase.auth();

  // Post a chat message (only uid and content stored; no raw IP logging)
  window.postMessage = async ({ username, content }) => {
    const user = auth.currentUser;
    const uid = user ? user.uid : null;
    const message = {
      username,
      content,
      uid,
      createdAt: Date.now(),
    };
    await db.ref('/chat').push(message);
  };

  // Subscribe to messages
  window.onMessages = (cb) => {
    db.ref('/chat').orderByChild('createdAt').limitToLast(200).on('value', snap => {
      const list = [];
      snap.forEach(child => list.push({ id: child.key, ...child.val() }));
      cb(list);
    });
  };
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof firebase !== 'undefined') initChat();
});

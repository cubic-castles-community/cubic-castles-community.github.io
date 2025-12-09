// Firebase Realtime Database marketplace helpers.
// Requires firebase scripts loaded by firebase-auth.js

function initSelling() {
  // eslint-disable-next-line no-undef
  const db = firebase.database();
  // eslint-disable-next-line no-undef
  const auth = firebase.auth();

  // Post a listing
  window.postListing = async ({ item, price, username, tag }) => {
    const user = auth.currentUser;
    const uid = user ? user.uid : null;
    const listing = {
      item,
      price,
      username,
      tag,
      uid,
      createdAt: Date.now(),
    };
    await db.ref('/selling').push(listing);
  };

  // Subscribe to listings
  window.onListings = (cb) => {
    db.ref('/selling').orderByChild('createdAt').limitToLast(200).on('value', snap => {
      const list = [];
      snap.forEach(child => list.push({ id: child.key, ...child.val() }));
      list.sort((a,b) => b.createdAt - a.createdAt);
      cb(list);
    });
  };
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof firebase !== 'undefined') initSelling();
});

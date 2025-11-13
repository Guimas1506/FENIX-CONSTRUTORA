// tools/sync-auth-emails.js
// Sync Firebase Auth user emails (and basic profile) into Firestore 'usuarios' and 'users'.
// Usage:
//   node tools\sync-auth-emails.js          -> dry-run, only prints what would change
//   node tools\sync-auth-emails.js --apply  -> actually write changes to Firestore
//   node tools\sync-auth-emails.js --apply --only-missing  -> only set fields when missing

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT = path.join(__dirname, '..', 'fenix-construtora-a34b5-firebase-adminsdk-fbsvc-b628946df9.json');
if (!fs.existsSync(SERVICE_ACCOUNT)) {
  console.error('Service account JSON not found at:', SERVICE_ACCOUNT);
  console.error('Place your service account JSON at that path or edit this script to point to it.');
  process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const apply = process.argv.includes('--apply');
const onlyMissing = process.argv.includes('--only-missing');

console.log(`Sync Auth -> Firestore (apply=${apply}, onlyMissing=${onlyMissing})`);

async function syncOnce() {
  let pageToken = undefined;
  let total = 0;
  let changed = 0;

  do {
    const res = await admin.auth().listUsers(1000, pageToken);
    for (const user of res.users) {
      total++;
      const uid = user.uid;
      const email = user.email || null;
      const displayName = user.displayName || null;
      const photoURL = user.photoURL || null;
      const claims = user.customClaims || {};
      const isAdmin = !!claims.admin;

      const uRef = db.collection('usuarios').doc(uid);
      const uRef2 = db.collection('users').doc(uid);

      const [snap1, snap2] = await Promise.all([uRef.get(), uRef2.get()]);
      const data1 = snap1.exists ? snap1.data() : {};
      const data2 = snap2.exists ? snap2.data() : {};

      const patch = {};
      if (email && (!data1.email || data1.email === '-' || onlyMissing && !data1.email)) patch.email = email;
      if (displayName && (!data1.nome || onlyMissing && !data1.nome)) patch.nome = displayName;
      if (photoURL && (!data1.photoURL || onlyMissing && !data1.photoURL)) patch.photoURL = photoURL;
      if (typeof isAdmin === 'boolean' && (data1.admin !== isAdmin)) patch.admin = isAdmin;

      const patch2 = {};
      if (email && (!data2.email || data2.email === '-' || onlyMissing && !data2.email)) patch2.email = email;
      if (displayName && (!data2.nome || onlyMissing && !data2.nome)) patch2.nome = displayName;
      if (photoURL && (!data2.photoURL || onlyMissing && !data2.photoURL)) patch2.photoURL = photoURL;
      if (typeof isAdmin === 'boolean' && (data2.admin !== isAdmin)) patch2.admin = isAdmin;

      const willChange = Object.keys(patch).length > 0 || Object.keys(patch2).length > 0;
      if (willChange) {
        console.log(`UID=${uid} -> will update:`, { usuarios: patch, users: patch2 });
        if (apply) {
          const ops = [];
          if (Object.keys(patch).length > 0) ops.push(uRef.set({ ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }));
          if (Object.keys(patch2).length > 0) ops.push(uRef2.set({ ...patch2, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }));
          try {
            await Promise.all(ops);
            changed++;
          } catch (err) {
            console.error('Error writing for uid', uid, err);
          }
        }
      }

      if (total % 100 === 0) console.log(`Processed ${total} users, changed ${changed}`);
    }
    pageToken = res.pageToken;
  } while (pageToken);

  console.log(`Done. Processed ${total} users. Documents updated: ${changed}.`);
}

syncOnce().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(2); });

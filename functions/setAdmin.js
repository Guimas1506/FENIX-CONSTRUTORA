// Usage: node setAdmin.js <UID>
// Runs using the functions environment credentials if available. For local use,
// set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path.

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

async function main(){
  const uid = process.argv[2];
  if(!uid){
    console.error('Usage: node setAdmin.js <UID>');
    process.exit(1);
  }
  try{
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log('Set admin claim for', uid);
  }catch(err){
    console.error('Error setting admin claim:', err);
    process.exit(1);
  }
}

main();

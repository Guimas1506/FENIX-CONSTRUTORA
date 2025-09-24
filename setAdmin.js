const admin = require("firebase-admin");
const serviceAccount = require("./fenix-construtora-a34b5-firebase-adminsdk-fbsvc-b628946df9.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const uid = "Iqbk7Mc4jufost1eApqIN6lNto43";

admin.auth().getUser(uid)
  .then(userRecord => {
    console.log("Claims atuais:", userRecord.customClaims); // veja se já tem { admin: true }
    return admin.auth().setCustomUserClaims(uid, { admin: true });
  })
  .then(() => console.log("Usuário agora é admin!"))
  .catch(console.error);

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.checkAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    return { allowed: false, message: "Usuário não autenticado" };
  }

  const user = await admin.auth().getUser(context.auth.uid);
  const claims = user.customClaims || {};

  return { allowed: claims.admin === true };
});

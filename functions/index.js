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

// Check if a specific user (by UID) has admin claim
exports.checkAdminClaims = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }
  
  const caller = await admin.auth().getUser(context.auth.uid);
  if (!caller.customClaims || caller.customClaims.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Apenas admins podem verificar claims de outros usuários');
  }

  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID necessário');
  }

  try{
    const user = await admin.auth().getUser(uid);
    const claims = user.customClaims || {};
    return { isAdmin: claims.admin === true };
  }catch(e){
    throw new functions.https.HttpsError('not-found', 'Usuário não encontrado');
  }
});

// Get user data (Auth + Firestore combined)
exports.getUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }
  
  const caller = await admin.auth().getUser(context.auth.uid);
  if (!caller.customClaims || caller.customClaims.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Apenas admins podem buscar dados de usuários');
  }

  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID necessário');
  }

  try {
    const authUser = await admin.auth().getUser(uid);
    let firestoreData = {};
    
    // Tenta 'usuarios' primeiro, depois 'users'
    try {
      const uDoc = await admin.firestore().collection('usuarios').doc(uid).get();
      if (uDoc.exists()) firestoreData = uDoc.data();
    } catch (e) { /* ignore */ }
    
    if (!firestoreData || Object.keys(firestoreData).length === 0) {
      try {
        const uDoc = await admin.firestore().collection('users').doc(uid).get();
        if (uDoc.exists()) firestoreData = uDoc.data();
      } catch (e) { /* ignore */ }
    }

    return {
      user: {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName || firestoreData.nome || firestoreData.displayName,
        photoURL: authUser.photoURL || firestoreData.photoURL,
        phoneNumber: authUser.phoneNumber || firestoreData.telefone,
        ...firestoreData
      }
    };
  } catch (e) {
    throw new functions.https.HttpsError('not-found', 'Usuário não encontrado: ' + e.message);
  }
});

// Create a new Firebase Auth user and corresponding Firestore document
exports.createUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }
  const caller = await admin.auth().getUser(context.auth.uid);
  if (!caller.customClaims || caller.customClaims.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Apenas admins podem criar usuários');
  }

  const { email, password, displayName, phoneNumber, role = 'user' } = data;
  if (!email || !password) {
    throw new functions.https.HttpsError('invalid-argument', 'Email e senha são necessários');
  }

  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: displayName || undefined,
    phoneNumber: phoneNumber || undefined,
  });

  // Padrão: 'user'. Se for admin, seta claim
  if (role === 'admin') {
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
  }

  await admin.firestore().collection('usuarios').doc(userRecord.uid).set({
    email,
    nome: displayName || '',
    displayName: displayName || '',
    phoneNumber: phoneNumber || '',
    telefone: phoneNumber || '',
    role: role === 'admin' ? 'admin' : 'user',
    status: 'Ativo',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { uid: userRecord.uid };
});

// Delete a Firebase Auth user and corresponding Firestore document
exports.deleteUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }
  const caller = await admin.auth().getUser(context.auth.uid);
  if (!caller.customClaims || caller.customClaims.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Apenas admins podem deletar usuários');
  }

  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID necessário');
  }

  try {
    // Deleta do Firebase Auth
    await admin.auth().deleteUser(uid);
  } catch (e) {
    console.warn('Could not delete from Auth:', e);
  }

  try {
    // Tenta deletar de 'usuarios'
    await admin.firestore().collection('usuarios').doc(uid).delete();
  } catch (e) {
    console.warn('Could not delete from usuarios:', e);
  }

  try {
    // Tenta deletar de 'users'
    await admin.firestore().collection('users').doc(uid).delete();
  } catch (e) {
    console.warn('Could not delete from users:', e);
  }

  return { deleted: true };
});

// Toggle admin claim for a user
exports.setAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }
  const caller = await admin.auth().getUser(context.auth.uid);
  if (!caller.customClaims || caller.customClaims.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Apenas admins podem alterar roles');
  }

  const { uid, makeAdmin } = data;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID necessário');
  }

  await admin.auth().setCustomUserClaims(uid, makeAdmin ? { admin: true } : {});
  
  // Atualiza em 'usuarios' (coleção principal)
  try {
    await admin.firestore().collection('usuarios').doc(uid).set({ role: makeAdmin ? 'admin' : 'user' }, { merge: true });
  } catch (e) {
    console.warn('Could not update usuarios:', e);
  }
  
  // Também atualiza em 'users' (fallback)
  try {
    await admin.firestore().collection('users').doc(uid).set({ role: makeAdmin ? 'admin' : 'user' }, { merge: true });
  } catch (e) {
    console.warn('Could not update users:', e);
  }

  return { ok: true };
});

// List users via Admin SDK (callable) - retorna usuários de ambas coleções com enriquecimento de Auth
exports.listUsers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }
  const caller = await admin.auth().getUser(context.auth.uid);
  if (!caller.customClaims || caller.customClaims.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Apenas admins podem listar usuários');
  }

  try {
    let users = [];
    
    // Carregar de ambas as coleções
    try {
      const snap1 = await admin.firestore().collection('usuarios').limit(500).get();
      snap1.forEach(d => users.push({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Could not read usuarios collection:', e);
    }

    try {
      const snap2 = await admin.firestore().collection('users').limit(500).get();
      snap2.forEach(d => {
        // Evita duplicatas
        if (!users.find(u => u.id === d.id)) {
          users.push({ id: d.id, ...d.data() });
        }
      });
    } catch (e) {
      console.warn('Could not read users collection:', e);
    }

    // Enriquece com dados do Firebase Auth
    const authMap = {};
    try {
      const result = await admin.auth().listUsers(1000);
      result.users.forEach(u => {
        authMap[u.uid] = {
          email: u.email || null,
          displayName: u.displayName || null,
          photoURL: u.photoURL || null
        };
      });
    } catch (e) {
      console.warn('Could not list auth users:', e);
    }

    // Mescla dados: Firestore tem prioridade, Auth é fallback
    users = users.map(u => ({
      ...u,
      email: u.email || authMap[u.id]?.email || null,
      nome: u.nome || authMap[u.id]?.displayName || null,
      photoURL: u.photoURL || authMap[u.id]?.photoURL || null
    }));

    return { users };
  } catch (e) {
    console.error('listUsers error:', e);
    throw new functions.https.HttpsError('internal', 'Erro ao listar usuários: ' + e.message);
  }
});

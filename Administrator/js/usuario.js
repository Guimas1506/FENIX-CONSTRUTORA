// Administrator/js/usuario.js
// Renderiza usuários de Firestore com dados enriquecidos do Firebase Auth
import { auth, db } from '../../firebase.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js';
import { onAuthStateChanged, getIdTokenResult } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { collection, getDocs, query, doc, getDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

const DEFAULT_AVATAR = 'img/do-utilizador.png';
const usersContainerSelector = '.adcionar';

function setDebug(msg){
  try{ console.debug('[usuario.js]', msg); }catch(e){}
}

// Semelhante ao info.js - obtém email de múltiplas fontes
async function obterEmailDoAuthUser(authUser) {
  if (!authUser) return null;
  if (authUser.email) return authUser.email;
  if (Array.isArray(authUser.providerData) && authUser.providerData.length) {
    const pd = authUser.providerData.find(p => p && p.email);
    if (pd && pd.email) return pd.email;
  }
  try { if (typeof authUser.reload === 'function') await authUser.reload(); } catch (err) { /* ignore */ }
  if (authUser.email) return authUser.email;
  if (Array.isArray(authUser.providerData) && authUser.providerData.length) {
    const pd2 = authUser.providerData.find(p => p && p.email);
    if (pd2 && pd2.email) return pd2.email;
  }
  try {
    const tokenRes = await getIdTokenResult(authUser);
    if (tokenRes?.claims?.email) return tokenRes.claims.email;
    const identities = tokenRes?.claims?.firebase?.identities;
    if (identities && typeof identities === 'object') {
      for (const key of Object.keys(identities)) {
        const arr = identities[key];
        if (Array.isArray(arr) && arr.length) {
          const maybe = arr.find(x => typeof x === 'string' && x.includes('@'));
          if (maybe) return maybe;
        }
      }
    }
  } catch (e) { /* ignore */ }
  return null;
}

// Obtém dados enriquecidos do Auth - nome, email, foto
async function obterDadosDoAuth(uid) {
  try {
    const functions = getFunctions();
    const fnGetUser = httpsCallable(functions, 'getUser');
    const res = await fnGetUser({ uid });
    return res.data.user || null;
  } catch (e) {
    setDebug(`Could not fetch user ${uid} from Auth: ${e.message}`);
    return null;
  }
}

// Enriquece usuários com dados do Auth
async function enriquecerComDadosAuth(users) {
  try {
    const functions = getFunctions();
    const fnListUsers = httpsCallable(functions, 'listUsers');
    const authRes = await fnListUsers({});
    const authUsers = authRes.data.users || [];

    const authMap = {};
    authUsers.forEach(au => {
      authMap[au.uid] = {
        email: au.email || null,
        displayName: au.displayName || null,
        photoURL: au.photoURL || null
      };
    });

    // Mescla dados: Firestore tem prioridade, Auth é fallback
    return users.map(u => ({
      ...u,
      email: u.email || authMap[u.id]?.email || '-',
      nome: u.nome || authMap[u.id]?.displayName || '-',
      photoURL: u.photoURL || authMap[u.id]?.photoURL || DEFAULT_AVATAR
    }));
  } catch (e) {
    setDebug('Could not enrich with Auth data: ' + e.message);
    // Fallback: adiciona valores padrão
    return users.map(u => ({
      ...u,
      email: u.email || '-',
      nome: u.nome || '-',
      photoURL: u.photoURL || DEFAULT_AVATAR
    }));
  }
}

// Para usuários sem email, tenta buscar localmente em Firestore e inspecionar campos
async function fetchMissingEmails(users){
  if(!Array.isArray(users) || users.length === 0) return;
  const emailRx = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

  function findEmailInObject(obj){
    if(!obj) return null;
    if(typeof obj === 'string'){
      const m = obj.match(emailRx);
      return m ? m[0] : null;
    }
    if(typeof obj !== 'object') return null;
    for(const k of Object.keys(obj)){
      try{
        const v = obj[k];
        if(typeof v === 'string'){
          const m = v.match(emailRx);
          if(m) return m[0];
        } else if(Array.isArray(v)){
          for(const item of v){
            const found = findEmailInObject(item);
            if(found) return found;
          }
        } else if(typeof v === 'object'){
          const found = findEmailInObject(v);
          if(found) return found;
        }
      }catch(e){ continue; }
    }
    return null;
  }

  try{
    await Promise.all(users.map(async (u) => {
      if(u.email && u.email !== '-' && u.email !== null) return; // já tem

      // 1) tenta encontrar email direto no objeto carregado
      const found1 = findEmailInObject(u);
      if(found1){ u.email = found1; updateCardForUser(u); return; }

      // 2) tenta re-carregar documento 'usuarios' por id e inspecionar
      try{
        const docU = await getDoc(doc(db, 'usuarios', String(u.id)));
        if(docU.exists()){
          const data = docU.data();
          const found2 = findEmailInObject(data);
          if(found2){ u.email = found2; if(data.nome) u.nome = u.nome || data.nome; if(data.photoURL) u.photoURL = u.photoURL || data.photoURL; updateCardForUser(u); return; }
        }
      }catch(e){ setDebug('error reading usuarios doc '+u.id+': '+(e.message||e)); }

      // 3) tenta re-carregar documento 'users' por id e inspecionar
      try{
        const docU2 = await getDoc(doc(db, 'users', String(u.id)));
        if(docU2.exists()){
          const data2 = docU2.data();
          const found3 = findEmailInObject(data2);
          if(found3){ u.email = found3; if(data2.nome) u.nome = u.nome || data2.nome; if(data2.photoURL) u.photoURL = u.photoURL || data2.photoURL; updateCardForUser(u); return; }
        }
      }catch(e){ setDebug('error reading users doc '+u.id+': '+(e.message||e)); }

      // 4) tenta campos comuns alternativos
      const alt = (u.userEmail || u.mail || u.loginEmail || u.contactEmail || (u.contact && u.contact.email) || (u.profile && u.profile.email) || null);
      if(alt && typeof alt === 'string' && alt.match(emailRx)){
        u.email = alt.match(emailRx)[0]; updateCardForUser(u); return;
      }

      // se nada encontrou, marca como '-' para evitar re-tries imediatos
      if(!u.email) u.email = '-';
    }));
  }catch(e){
    setDebug('fetchMissingEmails error: ' + (e.message || e));
  }
}

function updateCardForUser(u){
  try{
    const wrapperCards = document.querySelectorAll('.user-card-ref');
    wrapperCards.forEach(card => {
      const inner = card.querySelector('.card-inner');
      if(!inner) return;
      const uid = inner.getAttribute('data-uid');
      if(uid === String(u.id) || uid === u.id){
        // atualiza HTML do card
        card.innerHTML = buildUserHTML(u);
      }
    });
  }catch(e){
    console.warn('updateCardForUser error', e);
  }
}

function applyFilters(users){
  const form = document.getElementById('form-filtros');
  if(!form) return users;

  const role = (document.getElementById('role-filter')?.value || '').trim();
  const status = (document.getElementById('status-filter')?.value || '').trim();
  const uf = (document.getElementById('UF')?.value || '').trim();
  const city = (document.getElementById('city')?.value || '').trim();
  const sort = (document.getElementById('sort')?.value || '').trim();
  const searchTerm = (document.getElementById('sear')?.value || '').toLowerCase().trim();

  let filtered = users.filter(u => {
    if(role && u.role !== role && u.cargo !== role) return false;
    if(status && u.status !== status) return false;
    if(uf && u.uf !== uf) return false;
    if(city && u.cidade !== city) return false;
    
    // Filtro de pesquisa - busca em nome, email e telefone
    if(searchTerm){
      const nome = (u.nome || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const telefone = (u.telefone || '').toLowerCase();
      if(!nome.includes(searchTerm) && !email.includes(searchTerm) && !telefone.includes(searchTerm)){
        return false;
      }
    }
    
    return true;
  });

  // Aplicar sort
  if(sort === 'name-asc'){
    filtered.sort((a, b) => {
      const aName = (a.nome || '').toLowerCase();
      const bName = (b.nome || '').toLowerCase();
      return aName.localeCompare(bName, 'pt-BR');
    });
  } else if(sort === 'name-desc'){
    filtered.sort((a, b) => {
      const aName = (a.nome || '').toLowerCase();
      const bName = (b.nome || '').toLowerCase();
      return bName.localeCompare(aName, 'pt-BR');
    });
  }

  return filtered;
}

async function fetchAndRender(){
  const container = document.querySelector(usersContainerSelector);
  if(!container) return;

  let listWrapper = document.getElementById('users-list-wrapper');
  if(!listWrapper){
    listWrapper = document.createElement('div');
    listWrapper.id = 'users-list-wrapper';
    listWrapper.style.marginTop = '12px';
    container.parentNode.insertBefore(listWrapper, container.nextSibling);
  }

  listWrapper.innerHTML = '<p style="color:var(--Cor-Terciaria);padding:12px">Carregando usuários...</p>';

  try{
    let users = [];
    
    // PRIORIDADE 1: carregar AMBAS as coleções 'usuarios' e 'users'
    try{
      const q1 = query(collection(db, 'usuarios'));
      const snap1 = await getDocs(q1);
      snap1.forEach(s => users.push({ id: s.id, ...s.data() }));
      setDebug(`Loaded ${snap1.docs.length} users from 'usuarios' collection`);
    }catch(eUsuarios){
      setDebug('usuarios read failed: ' + (eUsuarios.message || eUsuarios));
      console.warn('usuarios read failed:', eUsuarios);
    }

    // Carregar também 'users'
    try{
      const q2 = query(collection(db, 'users'));
      const snap2 = await getDocs(q2);
      snap2.forEach(s => {
        // Evita duplicatas (se mesmo ID já existe)
        if(!users.find(u => u.id === s.id)){
          users.push({ id: s.id, ...s.data() });
        }
      });
      setDebug(`Loaded ${snap2.docs.length} users from 'users' collection`);
    }catch(eUsers){
      setDebug('users read failed: ' + (eUsers.message || eUsers));
      console.warn('users read failed:', eUsers);
    }

    // Se conseguiu usuários, enriquece com dados do Auth
    if(users.length > 0){
      users = await enriquecerComDadosAuth(users);
      setDebug(`Enriched ${users.length} users with Auth data`);
    }

    // Garante que todos têm role, defaultando para 'user'
    if(users.length > 0){
      users = users.map(u => ({
        ...u,
        role: u.role || 'user'
      }));
    }

    // Se conseguiu usuários, aplica filtros e renderiza
    if(users.length > 0){
      const filtered = applyFilters(users);
      if(filtered.length === 0){
        listWrapper.innerHTML = '<p style="color:var(--Cor-Terciaria);padding:12px">Nenhum usuário encontrado com esses filtros.</p>';
      } else {
        await renderList(filtered, listWrapper);
        try{ await fetchMissingEmails(filtered); }catch(e){ setDebug('fetchMissingEmails failed: '+(e.message||e)); }
      }
      return;
    }

    // PRIORIDADE 2: sem usuários locais, tenta callable (requer deploy + admin claim)
    try{
      setDebug('Attempting callable listUsers...');
      const functions = getFunctions();
      const fnList = httpsCallable(functions, 'listUsers');
      const res = await fnList({});
      const callableUsers = res.data.users || [];
      setDebug(`Callable returned ${callableUsers.length} users`);
      if(callableUsers.length === 0){
        listWrapper.innerHTML = '<p style="color:var(--Cor-Terciaria);padding:12px">Nenhum usuário encontrado.</p>';
        return;
      }
      const enrichedUsers = await enriquecerComDadosAuth(callableUsers);
      const withRoles = enrichedUsers.map(u => ({
        ...u,
        role: u.role || 'user'
      }));
      const filtered = applyFilters(withRoles);
      await renderList(filtered, listWrapper);
      try{ await fetchMissingEmails(filtered); }catch(e){ setDebug('fetchMissingEmails failed: '+(e.message||e)); }
      return;
    }catch(eCallable){
      setDebug('Callable listUsers failed: ' + (eCallable.message || eCallable));
      console.warn('listUsers callable failed:', eCallable);
    }

    // Nenhuma estratégia funcionou
    listWrapper.innerHTML = '<p style="color:var(--Cor-Terciaria);padding:12px">Erro ao carregar usuários. Veja console.</p>';
    const btn = document.createElement('button');
    btn.textContent = 'Carregar exemplo local';
    btn.className = 'btn btn-admin';
    btn.style.marginLeft = '12px';
    btn.onclick = () => renderMock(listWrapper);
    listWrapper.appendChild(btn);

  }catch(err){
    console.error('Unexpected error:', err);
    listWrapper.innerHTML = '<p style="color:var(--Cor-Terciaria);padding:12px">Erro inesperado. Veja console.</p>';
  }
}

function renderMock(wrapper){
  const sample = [
    { id:'m1', nome:'Usuário Test', email:'user@test.com', telefone:'11 96290-2932', cidade:'São Paulo', uf:'SP', status:'Ativo', role:'user', photoURL: DEFAULT_AVATAR },
    { id:'m2', nome:'Admin Test', email:'admin@test.com', telefone:'11 96543-2027', cidade:'Rio de Janeiro', uf:'RJ', status:'Ativo', role:'admin', photoURL: DEFAULT_AVATAR }
  ];
  wrapper.innerHTML = '';
  sample.forEach(u => {
    const card = document.createElement('div');
    card.className = 'user-card-ref';
    card.innerHTML = buildUserHTML(u);
    wrapper.appendChild(card);
  });
}

async function renderList(users, wrapper){
  wrapper.innerHTML = '';
  
  await Promise.all(users.map(async (u) => {
    const card = document.createElement('div');
    card.className = 'user-card-ref';
    
    try{
      card.innerHTML = buildUserHTML(u);
    }catch(e){
      console.error('render error for user', u.id, e);
      card.innerHTML = buildUserHTML(u);
    }
    
    wrapper.appendChild(card);
  }));
}

function safe(val){ return val ? val : '-'; }

function normalizeAvatar(url){
  if(!url || url === '') return DEFAULT_AVATAR;
  if(/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  if(url.startsWith('/')) return url;
  return url;
}

function buildUserHTML(u){
  const avatar = normalizeAvatar(u.photoURL || u.avatarURL || u.photo || u.foto);
  const name = safe(u.nome || u.displayName || u.name);
  // Email pode estar em vários campos dependendo da origem (Firebase Auth ou Google)
  const email = safe(u.email || u.userEmail || u.mail || u.loginEmail || u.uid);
  const telefone = safe(u.telefone || u.phoneNumber || u.phone);
  const endereco = safe(u.cidade || u.city || (u.uf ? `${u.uf}` : '-'));
  const cargo = safe(u.role || u.cargo);
  const status = safe(u.status || 'Ativo');

  setDebug(`render user ${u.id} - email: ${email} - user object:`, u);

  const userDataJson = JSON.stringify(u).replace(/"/g, '&quot;');

  return `
    <div class="card-inner" data-uid="${u.id}" data-user="${userDataJson}">
      <div class="avatar-block"><img src="${avatar}" class="ref-avatar" alt="Avatar" onerror="this.src='img/do-utilizador.png'"/></div>
      <div class="info-block">
        <h3 class="ref-name">${name}</h3>
        <div class="ref-row">
          <div class="meta"><strong>email</strong><div>${email}</div></div>
          <div class="meta"><strong>telefone</strong><div>${telefone}</div></div>
          <div class="meta"><strong>endereço</strong><div>${endereco}</div></div>
          <div class="meta"><strong>cargo</strong><div>${cargo}</div></div>
          <div class="meta"><strong>status</strong><div>${status}</div></div>
        </div>
      </div>
      <div class="actions-block">
            <button class="ref-btn ref-edit" data-uid="${u.id}">Editar</button>
            <button class="ref-btn ref-delete" data-uid="${u.id}">Excluir</button>
      </div>
    </div>`;
}

// Eventos para delete e edit
document.addEventListener('click', async (e) => {
  const del = e.target.closest('.ref-delete');
  if(del){
    const uid = del.getAttribute('data-uid');
    setDebug(`Delete clicked for UID: ${uid}`);
    
    if(!uid || uid === '' || uid === 'undefined'){
      alert('Erro: UID do usuário não identificado');
      return;
    }
    
    if(!confirm('Deseja apagar este usuário?')) return;
    try{
      const functions = getFunctions();
      const fnDelete = httpsCallable(functions, 'deleteUser');
      setDebug(`Calling deleteUser with uid: ${uid}`);
      await fnDelete({ uid });
      alert('Usuário apagado com sucesso');
      fetchAndRender();
      return;
    }catch(err){
      // If callable fails, try direct Firestore delete as fallback (same behavior as edit modal)
      console.warn('Callable delete failed, falling back to Firestore delete:', err);
      try {
        const docRef1 = doc(db, 'usuarios', uid);
        await deleteDoc(docRef1);
        const docRef2 = doc(db, 'users', uid);
        await deleteDoc(docRef2).catch(() => {});
        alert('Usuário apagado com sucesso (via Firestore)');
        fetchAndRender();
        return;
      } catch (e) {
        console.error('Direct delete also failed:', e);
        setDebug(`Direct delete also failed: ${e.message || e}`);
        alert('Erro ao apagar: ' + ((e && e.message) || (err && err.message) || err));
      }
    }
  }

  const edit = e.target.closest('.ref-edit');
  if(edit){
    const uid = edit.getAttribute('data-uid');
    setDebug(`Edit clicked for UID: ${uid}`);
    openEditModal(uid);
  }

  // (inspect removed)
});

// Modal management
let currentEditingUser = null;

function openEditModal(uid){
  const cardInner = document.querySelector(`[data-uid="${uid}"]`);
  if(!cardInner || !cardInner.getAttribute('data-user')){
    alert('Erro: dados do usuário não encontrados');
    return;
  }
  
  try{
    const userData = JSON.parse(cardInner.getAttribute('data-user'));
    populateEditModal(userData);
  }catch(e){
    console.error('Erro ao parsear dados do usuário:', e);
    alert('Erro ao abrir editor');
  }
}

// inspect functionality removed as requested

function populateEditModal(user){
  currentEditingUser = user;
  
  document.getElementById('edit-nome').value = user.nome || user.displayName || '';
  document.getElementById('edit-email').value = user.email || '';
  document.getElementById('edit-telefone').value = user.telefone || user.phoneNumber || '';
  document.getElementById('edit-cidade').value = user.cidade || user.city || '';
  document.getElementById('edit-uf').value = user.uf || '';
  document.getElementById('edit-status').value = user.status || 'Ativo';
  document.getElementById('edit-role').value = user.role || user.cargo || 'user';
  
  const modal = document.getElementById('edit-modal');
  modal.style.display = 'flex';
}

function closeEditModal(){
  const modal = document.getElementById('edit-modal');
  modal.style.display = 'none';
  currentEditingUser = null;
}

document.getElementById('edit-cancel')?.addEventListener('click', closeEditModal);

document.getElementById('edit-save')?.addEventListener('click', async () => {
  if(!currentEditingUser) return;
  
  const nome = document.getElementById('edit-nome').value.trim();
  const telefone = document.getElementById('edit-telefone').value.trim();
  const cidade = document.getElementById('edit-cidade').value.trim();
  const uf = document.getElementById('edit-uf').value.trim().toUpperCase();
  const status = document.getElementById('edit-status').value;
  const role = document.getElementById('edit-role').value;
  
  if(!nome){
    alert('Nome é obrigatório');
    return;
  }
  
  try{
    const docRef = doc(db, 'usuarios', currentEditingUser.id);
    
    await setDoc(docRef, {
      nome,
      telefone,
      cidade,
      uf,
      status,
      role,
      admin: role === 'admin' ? true : false,
      updatedAt: new Date()
    }, { merge: true });
    
    setDebug(`Updated usuario ${currentEditingUser.id} successfully`);
    
    // Tenta também atualizar em 'users' (fallback)
    try {
      const docRef2 = doc(db, 'users', currentEditingUser.id);
      await setDoc(docRef2, {
        nome,
        telefone,
        cidade,
        uf,
        status,
        role,
        admin: role === 'admin' ? true : false,
        updatedAt: new Date()
      }, { merge: true });
    } catch (e) {
      setDebug(`Warning: Could not update users collection: ${e.message}`);
    }
    
    // Se mudou o role para admin, atualiza via callable
    const oldRole = currentEditingUser.role || currentEditingUser.cargo;
    if(role !== oldRole){
      const functions = getFunctions();
      const fnSet = httpsCallable(functions, 'setAdmin');
      try{
        await fnSet({ uid: currentEditingUser.id, makeAdmin: role === 'admin' });
        setDebug(`Updated admin claim for ${currentEditingUser.id}`);
      }catch(e){
        setDebug(`Warning: Could not update admin claim: ${e.message}`);
      }
    }
    
    alert('Usuário atualizado com sucesso');
    closeEditModal();
    fetchAndRender();
  }catch(err){
    console.error('Erro ao salvar:', err);
    setDebug(`Error saving user: ${err.message}`);
    alert('Erro ao salvar: ' + (err.message || err));
  }
});

document.getElementById('edit-delete')?.addEventListener('click', async () => {
  if(!currentEditingUser) return;
  if(!confirm('Tem certeza que deseja deletar este usuário? Esta ação é irreversível.')) return;
  
  try{
    // Tenta deletar via Cloud Function primeiro
    const functions = getFunctions();
    const fnDelete = httpsCallable(functions, 'deleteUser');
    await fnDelete({ uid: currentEditingUser.id });
    setDebug(`Deleted user ${currentEditingUser.id} via Cloud Function`);
  }catch(err){
    // Se falhar, tenta deletar direto do Firestore
    setDebug(`Cloud Function delete failed, trying direct delete: ${err.message}`);
    try {
      const docRef1 = doc(db, 'usuarios', currentEditingUser.id);
      await deleteDoc(docRef1);
      
      const docRef2 = doc(db, 'users', currentEditingUser.id);
      await deleteDoc(docRef2).catch(() => {});
      
      setDebug(`Direct delete successful`);
    } catch (e) {
      setDebug(`Direct delete also failed: ${e.message}`);
    }
  }
  
  alert('Usuário deletado com sucesso');
  closeEditModal();
  fetchAndRender();
});

// Inicialização no DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector(usersContainerSelector);
  let listWrapper = document.getElementById('users-list-wrapper');
  if(!listWrapper && container){
    listWrapper = document.createElement('div');
    listWrapper.id = 'users-list-wrapper';
    listWrapper.style.marginTop = '12px';
    container.parentNode.insertBefore(listWrapper, container.nextSibling);
  }
  
  if(listWrapper) listWrapper.innerHTML = '<p style="color:var(--Cor-Terciaria);padding:12px">Aguardando autenticação...</p>';

  onAuthStateChanged(auth, async (user) => {
    if(user){
      setDebug(`Autenticado: uid=${user.uid}`);
      fetchAndRender();
    } else {
      if(listWrapper) listWrapper.innerHTML = '<p style="color:var(--Cor-Terciaria);padding:12px">Faça login para ver usuários.</p>';
      setDebug('Usuário não autenticado');
    }
  });
});

// Ligar botões de filtro
const aplicarBtn = document.getElementById('aplicar');
const limparBtn = document.getElementById('limpar');
const searchInput = document.getElementById('sear');

if(aplicarBtn){ 
  aplicarBtn.addEventListener('click', (e) => { 
    e.preventDefault(); 
    fetchAndRender(); 
  }); 
}

if(limparBtn){ 
  limparBtn.addEventListener('click', (e) => { 
    e.preventDefault(); 
    const form = document.getElementById('form-filtros'); 
    if(form) form.reset(); 
    if(searchInput) searchInput.value = '';
    fetchAndRender(); 
  }); 
}

// Pesquisa em tempo real
if(searchInput){
  searchInput.addEventListener('input', () => {
    const container = document.querySelector(usersContainerSelector);
    const listWrapper = document.getElementById('users-list-wrapper');
    
    if(!listWrapper) return;
    
    // Busca todos os cards atuais
    const cards = document.querySelectorAll('.user-card-ref');
    if(cards.length === 0) return;
    
    // Pega os usuários dos cards
    const visibleUsers = Array.from(cards).map(card => {
      const inner = card.querySelector('.card-inner');
      if(!inner) return null;
      const userData = inner.getAttribute('data-user');
      if(!userData) return null;
      try {
        return JSON.parse(userData);
      } catch (e) {
        return null;
      }
    }).filter(u => u !== null);
    
    // Aplica filtro de pesquisa
    const filtered = applyFilters(visibleUsers);
    
    // Mostra/esconde cards
    const searchTerm = searchInput.value.toLowerCase().trim();
    cards.forEach(card => {
      const inner = card.querySelector('.card-inner');
      const userData = inner?.getAttribute('data-user');
      if(!userData) return;
      
      try {
        const user = JSON.parse(userData);
        const match = filtered.some(f => f.id === user.id);
        card.style.display = match ? '' : 'none';
      } catch (e) {
        card.style.display = '';
      }
    });
  });
}

export { fetchAndRender };

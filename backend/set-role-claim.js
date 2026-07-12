// set-role-claim.js
// Uso: node set-role-claim.js EMAIL ROL
// Roles válidos: dpo, admin, legal, operador, auditor
//
// Ejemplo:
//   node set-role-claim.js maria@empresa.cl legal

const admin          = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const ROLES_VALIDOS = ['dpo', 'admin', 'legal', 'operador', 'auditor'];
const [,, email, role] = process.argv;

if (!email || !role) {
  console.error('❌ Uso: node set-role-claim.js EMAIL ROL');
  console.error('   Roles válidos:', ROLES_VALIDOS.join(', '));
  process.exit(1);
}

if (!ROLES_VALIDOS.includes(role)) {
  console.error(`❌ Rol inválido: "${role}". Usa: ${ROLES_VALIDOS.join(', ')}`);
  process.exit(1);
}

async function main() {
  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log(`✅ Usuario: ${user.uid} (${user.email})`);
    await admin.auth().setCustomUserClaims(user.uid, { role });
    console.log(`✅ Rol asignado: { role: '${role}' }`);
    console.log(`⚠️  El usuario debe cerrar sesión y volver a entrar`);
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    process.exit(0);
  }
}

main();

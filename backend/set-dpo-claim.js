// set-dpo-claim.js
// Ejecutar desde backend/: node set-dpo-claim.js EMAIL_DEL_DPO
//
// Ejemplo:
//   node set-dpo-claim.js jerezcarlos70@gmail.com

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const email = process.argv[2];

if (!email) {
  console.error('❌ Uso: node set-dpo-claim.js EMAIL_DEL_DPO');
  process.exit(1);
}

async function main() {
  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log(`✅ Usuario encontrado: ${user.uid} (${user.email})`);

    await admin.auth().setCustomUserClaims(user.uid, { role: 'dpo' });
    console.log(`✅ Custom claim { role: 'dpo' } asignado correctamente`);
    console.log(`⚠️  El usuario debe cerrar sesión y volver a iniciar para que el token se actualice`);

  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    process.exit(0);
  }
}

main();
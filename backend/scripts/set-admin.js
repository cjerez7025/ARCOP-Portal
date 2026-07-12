require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Resolver GOOGLE_APPLICATION_CREDENTIALS a ruta absoluta si es relativa
const path = require('path');
if (
  process.env.GOOGLE_APPLICATION_CREDENTIALS &&
  !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
    __dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

const { auth } = require('../src/services/firebase');

const EMAIL = process.argv[2];

if (!EMAIL) {
  console.error('Uso: node scripts/set-admin.js tu@email.cl');
  process.exit(1);
}

auth.getUserByEmail(EMAIL)
  .then(user => auth.setCustomUserClaims(user.uid, { role: 'admin' }))
  .then(() => console.log(`✅ Claim role:admin asignado a ${EMAIL}`))
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });

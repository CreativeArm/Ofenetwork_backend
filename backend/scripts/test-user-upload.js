const cloudinary = require('cloudinary').v2;
const { Client } = require('pg');

cloudinary.config({
  cloud_name: 'bjz9hax2',
  api_key: '976641323298923',
  api_secret: 'RORswraybsnrI3YiwGXQXt4QJTM',
  secure: true
});

async function testOne() {
  const client = new Client({
    host: '18.202.64.2',
    port: 6543,
    user: 'postgres.sqghrsygxqleammpjjor',
    password: 'OfenetworksDb_2026!StrongPass',
    database: 'postgres',
    ssl: { rejectUnauthorized: false, servername: 'aws-1-eu-west-1.pooler.supabase.com' }
  });
  await client.connect();
  const res = await client.query('SELECT id, email, "kycDocumentUrl" FROM "User" WHERE email = \'sabogideonb@gmail.com\';');
  const user = res.rows[0];
  console.log(`Testing upload for ${user.email}, length: ${user.kycDocumentUrl.length}`);
  
  try {
    const uploadRes = await cloudinary.uploader.upload(user.kycDocumentUrl, {
      folder: 'ofenetwork/kyc',
      resource_type: 'auto'
    });
    console.log('Upload success! URL:', uploadRes.secure_url);
  } catch (err) {
    console.error('Upload error:', err);
  }
  await client.end();
}

testOne();

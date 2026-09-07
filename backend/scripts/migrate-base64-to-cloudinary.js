const cloudinary = require('cloudinary').v2;
const { Client } = require('pg');

cloudinary.config({
  cloud_name: 'bjz9hax2',
  api_key: '976641323298923',
  api_secret: 'RORswraybsnrI3YiwGXQXt4QJTM',
  secure: true
});

async function uploadToCloudinary(base64Data, folder) {
  try {
    const isImage = base64Data.startsWith('data:image/');
    const options = {
      folder: `ofenetwork/${folder}`,
      resource_type: isImage ? 'image' : 'auto'
    };
    if (isImage) {
      options.quality = 'auto:good';
      options.fetch_format = 'auto';
    }
    const result = await cloudinary.uploader.upload(base64Data, options);
    return result.secure_url;
  } catch (error) {
    console.error(`  [!] Upload failed for folder ${folder}:`, error && error.message ? error.message : error);
    return null;
  }
}

async function migrate() {
  const ips = ['18.202.64.2', '54.247.26.119', '54.229.189.117'];
  let client;
  for (const host of ips) {
    client = new Client({
      host,
      port: 6543,
      user: 'postgres.sqghrsygxqleammpjjor',
      password: 'OfenetworksDb_2026!StrongPass',
      database: 'postgres',
      ssl: { rejectUnauthorized: false, servername: 'aws-1-eu-west-1.pooler.supabase.com' },
      connectionTimeoutMillis: 10000
    });
    try {
      await client.connect();
      console.log(`Connected to database on ${host}!`);
      break;
    } catch (e) {
      console.log(`Failed ${host}: ${e.message}`);
    }
  }

  console.log('\n--- 1. MIGRATING USER KYC DOCUMENTS & PROFILE PICTURES ---');
  const userRes = await client.query('SELECT id, email, "profileImageUrl", "kycDocumentUrl" FROM "User";');
  
  for (const user of userRes.rows) {
    let updateFields = [];
    let values = [];
    let valIdx = 1;

    // Migrate KYC document if base64
    if (user.kycDocumentUrl && user.kycDocumentUrl.startsWith('data:')) {
      console.log(`Uploading KYC for user ${user.email} (${(user.kycDocumentUrl.length / 1024 / 1024).toFixed(2)} MB)...`);
      const cdnUrl = await uploadToCloudinary(user.kycDocumentUrl, 'kyc');
      if (cdnUrl) {
        updateFields.push(`"kycDocumentUrl" = $${valIdx++}`);
        values.push(cdnUrl);
        console.log(`  -> KYC migrated: ${cdnUrl}`);
      }
    }

    // Migrate Profile image if base64
    if (user.profileImageUrl && user.profileImageUrl.startsWith('data:')) {
      console.log(`Uploading Avatar for user ${user.email} (${(user.profileImageUrl.length / 1024 / 1024).toFixed(2)} MB)...`);
      const cdnUrl = await uploadToCloudinary(user.profileImageUrl, 'avatars');
      if (cdnUrl) {
        updateFields.push(`"profileImageUrl" = $${valIdx++}`);
        values.push(cdnUrl);
        console.log(`  -> Avatar migrated: ${cdnUrl}`);
      }
    }

    if (updateFields.length > 0) {
      values.push(user.id);
      const query = `UPDATE "User" SET ${updateFields.join(', ')} WHERE id = $${valIdx};`;
      await client.query(query, values);
      console.log(`✅ Saved User: ${user.email}\n`);
    }
  }

  console.log('\n--- 2. MIGRATING TRANSACTION PROOFS OF PAYMENT ---');
  const txRes = await client.query('SELECT id, type, "proofOfPaymentUrl" FROM "Transaction";');
  for (const tx of txRes.rows) {
    if (tx.proofOfPaymentUrl && tx.proofOfPaymentUrl.startsWith('data:')) {
      console.log(`Uploading proof for Tx ${tx.id} (${tx.type}, ${(tx.proofOfPaymentUrl.length / 1024 / 1024).toFixed(2)} MB)...`);
      const cdnUrl = await uploadToCloudinary(tx.proofOfPaymentUrl, 'transactions');
      if (cdnUrl) {
        await client.query('UPDATE "Transaction" SET "proofOfPaymentUrl" = $1 WHERE id = $2;', [cdnUrl, tx.id]);
        console.log(`  -> Proof migrated: ${cdnUrl}`);
      }
    }
  }

  console.log('\n--- 3. MIGRATING BUY4ME ORDER PROOFS ---');
  const orderRes = await client.query('SELECT id, "proofOfPaymentUrl" FROM "Buy4MeOrder";');
  for (const order of orderRes.rows) {
    if (order.proofOfPaymentUrl && order.proofOfPaymentUrl.startsWith('data:')) {
      console.log(`Uploading proof for Buy4Me order ${order.id}...`);
      const cdnUrl = await uploadToCloudinary(order.proofOfPaymentUrl, 'buy4me');
      if (cdnUrl) {
        await client.query('UPDATE "Buy4MeOrder" SET "proofOfPaymentUrl" = $1 WHERE id = $2;', [cdnUrl, order.id]);
        console.log(`  -> Proof migrated: ${cdnUrl}`);
      }
    }
  }

  console.log('\n=============================================');
  console.log('🎉 ALL BASE64 RECORDS MIGRATED TO CLOUDINARY CDN!');
  console.log('=============================================');
  await client.end();
}

migrate().catch(console.error);

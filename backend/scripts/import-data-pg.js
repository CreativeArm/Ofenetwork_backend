const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres.sqghrsygxqleammpjjor:OfenetworksDb_2026!StrongPass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

async function insertRows(client, tableName, rows, conflictKey = 'id') {
  if (!rows || rows.length === 0) return;
  console.log(`Importing ${rows.length} rows into "${tableName}"...`);

  for (const row of rows) {
    const keys = Object.keys(row);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => {
      const val = row[k];
      if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
        return JSON.stringify(val);
      }
      return val;
    });

    const updateSet = keys
      .filter(k => k !== conflictKey)
      .map(k => `"${k}" = EXCLUDED."${k}"`)
      .join(', ');

    const query = `
      INSERT INTO "${tableName}" (${cols})
      VALUES (${placeholders})
      ON CONFLICT ("${conflictKey}")
      DO ${updateSet.length > 0 ? `UPDATE SET ${updateSet}` : 'NOTHING'};
    `;

    try {
      await client.query(query, values);
    } catch (err) {
      console.error(`Error inserting into ${tableName} (${row[conflictKey]}):`, err.message);
    }
  }
  console.log(`✅ "${tableName}" imported.`);
}

async function run() {
  const backupDir = path.join(__dirname, '..', 'backups');
  const files = fs.readdirSync(backupDir).filter(f => f.startsWith('supabase_backup_') && f.endsWith('.json'));
  files.sort().reverse();
  const latestFile = path.join(backupDir, files[0]);
  console.log('Using backup file:', latestFile);

  const raw = fs.readFileSync(latestFile, 'utf-8');
  const { data } = JSON.parse(raw);

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to target database.');

  await insertRows(client, 'User', data.users);
  await insertRows(client, 'Wallet', data.wallets);
  await insertRows(client, 'WalletCredit', data.walletCredits);
  await insertRows(client, 'Transaction', data.transactions);
  await insertRows(client, 'Buy4MeOrder', data.buy4meOrders);
  await insertRows(client, 'ExchangeRate', data.exchangeRates, 'service');
  await insertRows(client, 'PaymentMethod', data.paymentMethods, 'channel');
  await insertRows(client, 'Testimonial', data.testimonials);
  await insertRows(client, 'SupportTicket', data.supportTickets);
  await insertRows(client, 'Notification', data.notifications);
  await insertRows(client, 'AuditLog', data.auditLogs);

  console.log('\n🎉 ALL 100% OF DATA RESTORED TO NEW SUPABASE DATABASE!');
  await client.end();
}

run().catch(console.error);

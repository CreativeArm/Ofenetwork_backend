const { PrismaClient } = require('@prisma/client');

const regions = [
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'eu-north-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'ca-central-1',
  'sa-east-1'
];

async function checkPooler(host, port) {
  const url = `postgresql://postgres.sqghrsygxqleammpjjor:OfenetworksDb_2026!StrongPass@${host}:${port}/postgres?pgbouncer=true`;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(`🎉 FOUND WORKING POOLER: ${host}:${port}`);
    return url;
  } catch (err) {
    if (!err.message.includes("Can't reach database server")) {
      console.log(`Response from ${host}:${port} ->`, err.message.substring(0, 100));
    }
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function findRegion() {
  console.log('Searching all Supabase pooler regions...');
  for (const r of regions) {
    for (const prefix of ['aws-0', 'aws-1']) {
      const host = `${prefix}-${r}.pooler.supabase.com`;
      for (const port of [6543, 5432]) {
        const found = await checkPooler(host, port);
        if (found) {
          console.log('Use this exact DATABASE_URL:');
          console.log(found);
          return;
        }
      }
    }
  }
  console.log('Finished searching.');
}

findRegion();

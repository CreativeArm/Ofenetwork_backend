const { Redis } = require("ioredis");

async function main() {
  const redis = new Redis("redis://127.0.0.1:6379");
  redis.on('error', (err) => console.error('Redis error', err));
  
  const keys = await redis.keys('*');
  console.log('Keys:', keys);
  
  const rates = await redis.get('rates:all');
  console.log('rates:all:', rates);
  
  process.exit(0);
}

main().catch(console.error);

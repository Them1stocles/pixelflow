const Redis = require('ioredis');

const redisUrl = 'rediss://default:AWBtAAIncDJhZDdkYTQzMjc2ODg0OWNmYjRjZjA2YWJmNjNjZjc4M3AyMjQ2ODU@gorgeous-pup-24685.upstash.io:6379';

console.log('Testing Redis connection...');
console.log('URL:', redisUrl.replace(/:[^:@]+@/, ':***@')); // Hide password

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    console.log(`Retry attempt ${times}, waiting ${delay}ms...`);
    return delay;
  },
  tls: {
    rejectUnauthorized: false
  }
});

redis.on('connect', () => {
  console.log('✓ Redis connected');
});

redis.on('ready', () => {
  console.log('✓ Redis ready');
});

redis.on('error', (error) => {
  console.error('✗ Redis error:', error.message);
});

redis.on('close', () => {
  console.log('✗ Redis connection closed');
});

// Test ping
setTimeout(async () => {
  try {
    console.log('\nTesting PING command...');
    const result = await redis.ping();
    console.log('✓ PING response:', result);

    console.log('\nTesting SET command...');
    await redis.set('test-key', 'test-value');
    console.log('✓ SET successful');

    console.log('\nTesting GET command...');
    const value = await redis.get('test-key');
    console.log('✓ GET response:', value);

    console.log('\n✓ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}, 2000);

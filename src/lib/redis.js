import { createClient } from 'redis';

let redisClient = null;
let redisConnected = false;

export async function getRedisClient() {
  if (redisConnected && redisClient) {
    return redisClient;
  }

  if (!redisClient) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.warn('⚠️ Redis connection failed. App will work without caching.');
              return new Error('Redis unavailable');
            }
            return retries * 100;
          },
        },
      });

      redisClient.on('error', (err) => {
        console.warn('⚠️ Redis Error:', err.message);
        redisConnected = false;
      });
      
      redisClient.on('connect', () => {
        console.log('✅ Redis connected');
        redisConnected = true;
      });

      await redisClient.connect();
      redisConnected = true;
    } catch (error) {
      console.warn('⚠️ Redis connection failed. App will work without caching.');
      redisConnected = false;
      return null;
    }
  }

  return redisConnected ? redisClient : null;
}

export async function setCache(key, value, expiryInSeconds = 3600) {
  try {
    const client = await getRedisClient();
    if (!client) {
      return; // Silently skip if Redis unavailable
    }
    await client.setEx(key, expiryInSeconds, JSON.stringify(value));
  } catch (error) {
    console.warn('⚠️ Cache set failed (Redis unavailable)');
    // Continue without caching
  }
}

export async function getCache(key) {
  try {
    const client = await getRedisClient();
    if (!client) {
      return null;
    }
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('⚠️ Cache get failed (Redis unavailable)');
    return null;
  }
}

export async function deleteCache(key) {
  try {
    const client = await getRedisClient();
    if (!client) {
      return;
    }
    await client.del(key);
  } catch (error) {
    console.warn('⚠️ Cache delete failed (Redis unavailable)');
  }
}

export async function clearCache(pattern = '*') {
  try {
    const client = await getRedisClient();
    if (!client) {
      return;
    }
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.warn('⚠️ Cache clear failed (Redis unavailable)');
  }
}

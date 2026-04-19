import IORedis, { type Redis } from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

function build(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL missing — required for BullMQ queues.');
  }
  return new IORedis(url, {
    maxRetriesPerRequest: null, // BullMQ requirement
    enableReadyCheck: false,
  });
}

export function getRedis(): Redis {
  if (process.env.NODE_ENV !== 'production' && globalThis.__redis) {
    return globalThis.__redis;
  }
  const client = build();
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__redis = client;
  }
  return client;
}

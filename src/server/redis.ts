import { createClient } from "redis";

export const isRedisEnabled = process.env.REDIS_ENABLED !== 'false';

const client = isRedisEnabled ? createClient({
    url: process.env.REDIS_URL,
    name: 'v1',
}) : null;

if (client) {
    client.on('connect', () => {
        console.log('CacheStore - Connection status: connected');
    });
    client.on('end', () => {
        console.log('CacheStore - Connection status: disconnected');
    });
    client.on('reconnecting', () => {
        console.log('CacheStore - Connection status: reconnecting');
    });
    client.on('error', (err) => {
        console.log('CacheStore - Connection status: error ', { err });
    });
    client.connect();
}

export const getRedis = async () => {
    if (!isRedisEnabled) {
        return null;
    }
    return client!;
}


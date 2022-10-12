import { createClient } from "redis";

const client = createClient({
    url: process.env.REDIS_URL,
    name: 'v1',
});
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

export const getRedis = async () => {
    return client;
}

import { RedisCache } from './redis'
import { LocalInMemoryCache } from './local'

export const isRedisEnabled = process.env.REDIS_ENABLED !== 'false';

const cacheImpl = isRedisEnabled ? RedisCache() : LocalInMemoryCache()

export const getCache = () => {
    return cacheImpl;
}
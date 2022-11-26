import Redis from 'ioredis'

import { Cache, Key, Value, ValueCallback } from './types'
import {DEFAULT_CACHE_TTL} from "../../../config";

export const RedisCache = (): Cache => {
  const redis = new Redis(process.env.REDIS_URL as string)
    redis.on('connect', () => {
        console.log('CacheStore - Connection status: connected');
    });
    redis.on('end', () => {
        console.log('CacheStore - Connection status: disconnected');
    });
    redis.on('reconnecting', () => {
        console.log('CacheStore - Connection status: reconnecting');
    });
    redis.on('error', (err) => {
        console.log('CacheStore - Connection status: error ', { err });
    });
  return {
    getAndSet<T extends Value>(
      key: Key,
      valueFunction: ValueCallback<T>,
      ttl: number = DEFAULT_CACHE_TTL,
    ): Promise<T> {
      return new Promise<T>((resolve) => {
        this.get(key).then((value) => {
          if (value) {
            resolve(value as T)
          } else {
            valueFunction().then((newValue) => {
              resolve(newValue)
              this.set(key, newValue, ttl)
            })
          }
        })
      })
    },
    flush(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        redis.flushdb((err) => {
          if (err) {
            reject()
          } else {
            resolve()
          }
        })
      })
    },
    get<T extends Value>(key: Key): Promise<T> {
      return new Promise((resolve, reject) => {
        try {
          redis.hgetall(key, (err, result) => {
            if (err) {
              reject()
            }
            // we need to convert the value back to the proper type
            if (result && result.type) {
              if (result.type === 'number') {
                resolve(Number(result.data) as T) // we need to convert the stringified number back to a number
              } else if (result.type === 'string') {
                resolve(result.data as T) // no conversion needed, ioredis stores all them values as strings
              } else {
                resolve(JSON.parse(result.data) as T) // convert the json string back to an object
              }
            } else {
              resolve(null as T)
            }
          })
        } catch (e) {
          console.log(`unable to retrieve/parse value of cache key:${key}`)
          redis.del(key)
          resolve(null as T)
        }
      })
    },
    set<T extends Value>(key: string, value: T, ttl = DEFAULT_CACHE_TTL): void {
      if (value === null) {
        return
      }
      // in redis, we only know primitives
      const data = {
        type: typeof value,
        data: JSON.stringify(value), // we need to encode this to a string, otherwise all our values would be converted to string anyway
      }
      redis.hmset(key, data)
      redis.expire(key, ttl)
    },
  }
}

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
      let finalResult : any = null
      return new Promise((resolve, reject) => {
        try {
          redis.hgetall(key, (err, result) => {

            // guard: if there is an error, reject the promise and bail out.
            if (err) {
              reject()
              return;
            }

            // guard: if there is no result, resolve the promise with null and bail out.
            if (!(result && result.type)) {
              resolve(finalResult)
              return;
            }

            // we got something and need to convert the value back to the proper type.
            if (result.type === 'number') {
              finalResult = Number(result.data) as T // we need to convert the stringified number back to a number
            } else if (result.type === 'string') {
              finalResult = result.data as T // no conversion needed, ioredis stores all them values as strings
            } else {
              finalResult = JSON.parse(result.data) as T // convert the json string back to an object
            }
          })
        } catch (e) {
          // upon any error, log it and remove the cache key so that we don't get the same error twice.
          // This also might mitigate the issue if the error is caused by a bad value in the cache
          console.log(`unable to retrieve/parse value of cache key:${key}`)
          redis.del(key)
        } finally {
          // what ever happens - resolve the promise
          resolve(finalResult)
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

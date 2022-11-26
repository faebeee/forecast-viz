import { Cache, Key, Value, ValueCallback } from './types'

export const LocalInMemoryCache = (): Cache => {
  const data = new Map<Key, unknown>()
  return {
    getAndSet<T extends Value>(
      key: Key,
      valueFunction: ValueCallback<T>,
    ): Promise<T> {
      return new Promise<T>((resolve) => {
        this.get(key).then((value) => {
          if (value) {
            resolve(value as T)
          } else {
            valueFunction().then((newValue) => {
              resolve(newValue)
              this.set(key, newValue)
            })
          }
        })
      })
    },
    flush(): Promise<void> {
      return new Promise<void>((resolve) => {
        data.clear()
        resolve()
      })
    },
    get<T extends Value>(key: Key): Promise<T> {
      return new Promise<T>((resolve) => {
        if (data.has(key)) {
          resolve(data.get(key) as T)
        } else {
          resolve(null as T)
        }
      })
    },
    set<T>(key: string, value: T): void {
      data.set(key, value)
    },
  }
}

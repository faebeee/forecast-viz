import { Cache, Key, Value, ValueFunction } from './types'

export const LocalInMemoryCache = (): Cache => {
  const data = new Map<Key, unknown>()
  return {
    async getAndSet<T extends Value>(
      key: Key,
      valueFunction: ValueFunction<T>
    ): Promise<T> {
      const value = await this.get(key)
      if (value) {
        return value as T
      } else {
        const newValue = await valueFunction()
        this.set(key, newValue)
        return newValue
      }
    },
    async flush(): Promise<void> {
      return data.clear()
    },
    async get<T extends Value>(key: Key): Promise<T> {
      if (data.has(key)) {
        return data.get(key) as T
      } else {
        return null as T
      }
    },
    set<T>(key: string, value: T): void {
      data.set(key, value)
    },
  }
}

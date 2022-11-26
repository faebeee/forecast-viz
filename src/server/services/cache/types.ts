export type Value = number | string | object | null
export type Key = string
export type ValueCallback<T> = () => Promise<T>

export interface Cache {
  set<T extends Value>(key: Key, value: T, ttl?: number): void
  get<T extends Value>(key: Key): Promise<T>
  getAndSet<T extends Value>(
    key: Key,
    valueFunction: ValueCallback<T>,
    ttl?: number,
  ): Promise<T>
  flush(): Promise<void>
}

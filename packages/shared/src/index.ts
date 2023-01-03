export const isObject = (value: unknown) =>
  value !== null && typeof value === 'object'

export const hasChanged = (newValue: any, oldValue: any): boolean =>
  !Object.is(newValue, oldValue)

export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'

import { track, trigger } from './effect'

const get = createGetter()
const set = createSetter()

export const mutableHandles: ProxyHandler<object> = {
  get,
  set
}

/**
 * 创建并返回一个getter函数
 * @returns
 */
function createGetter() {
  return function get(target: object, key: string | symbol, receiver: object) {
    const res = Reflect.get(target, key, receiver)

    // 依赖收集(收集触发getter函数，以便触发setter时执行该函数)
    track(target, key)

    return res
  }
}

function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ) {
    const isSet = Reflect.set(target, key, value, receiver)
    // 触发依赖
    trigger(target, key, value)
    return isSet
  }
}

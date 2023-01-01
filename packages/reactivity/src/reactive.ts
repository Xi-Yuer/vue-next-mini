import { mutableHandles } from './baseHandlers'

export const reactiveMap = new WeakMap<object, any>()

export function reactive(target: object) {
  return createReactiveObject(target, mutableHandles, reactiveMap)
}

function createReactiveObject(
  target: object,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>
) {
  // 判断是否有缓存(有则直接返回)
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  //没有-创建缓存-返回代理对象
  const proxy = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxy)
  return proxy
}

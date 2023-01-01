export function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn)
  // 第一次执行
  _effect.run()
}

export let activeEffect: ReactiveEffect | undefined
export class ReactiveEffect<T = any> {
  constructor(public fn: () => T) {}
  run() {
    // 标记当前被激活的reactive
    activeEffect = this // this:{fn: ƒ}
    return this.fn()
  }
}

type KeyToDepMap = Map<any, ReactiveEffect>

/**
 * 用于保存收集的依赖
 */
const targetMap = new WeakMap<any, KeyToDepMap>()

/**
 * 收集依赖(收集的依赖会被保存到 targetMap 中)
 *                              {{target:{ key: activeEffect }}} // activeEffect:为临时保存的值
 *                    weakMap=> { { { name:"Tom"}: {'name':{fn:()=>{} } } } } } :数据结构
 * @param target
 * @param key
 */
export function track(target: object, key: unknown) {
  if (!activeEffect) return // 如果没有保存直接返回
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    // 如果不存在
    targetMap.set(target, (depsMap = new Map()))
  }
  depsMap.set(key, activeEffect)
}

/**
 * 触发依赖
 * @param target
 * @param key
 * @param value
 */
export function trigger(target: object, key: unknown, newValue: unknown) {
  // 触发依赖其实就是执行 targetMap 中对应 effect然后执行对应的函数 fn
  console.log('trigger:触发依赖')

  const depsMap = targetMap.get(target)
  if (!depsMap) return // 如果不存在直接返回
  const effect = depsMap.get(key) as ReactiveEffect // 获取到对应的
  if (!effect) return

  // 如果 effect 存在 则执行指定属性对应的函数（依赖触发）
  effect.fn()
}

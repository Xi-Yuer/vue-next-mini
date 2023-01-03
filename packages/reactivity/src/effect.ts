import { ComputedImpl } from './computed'
import { createDep, Dep } from './dep'

export function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn)
  // 第一次执行
  _effect.run()
}

export let activeEffect: ReactiveEffect | undefined
export class ReactiveEffect<T = any> {
  computed?: ComputedImpl<T>
  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null
  ) {}
  run() {
    // 标记当前被激活的reactive
    activeEffect = this // this:{computed: ComputedImpl, fn: ƒ, scheduler: ƒ}
    return this.fn()
  }
}

type KeyToDepMap = Map<any, Dep>
export type EffectScheduler = (...args: any[]) => any

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
  let depsMap = targetMap.get(target) // {'name':{fn:()=>{} } }
  if (!depsMap) {
    // 如果不存在
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key) // {fn:()=>{} }
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }
  trackEffects(dep)
}

/**
 * 利用 dep 依次跟踪指定 key 的 所有effect
 */
export function trackEffects(dep: Dep) {
  dep.add(activeEffect!)
}

/**
 * 触发依赖
 * @param target
 * @param key
 * @param value
 */
export function trigger(target: object, key: unknown, newValue: unknown) {
  // 触发依赖其实就是执行 targetMap 中对应 effect然后执行对应的函数 fn
  const depsMap = targetMap.get(target)
  if (!depsMap) return // 如果不存在直接返回
  const dep: Dep | undefined = depsMap.get(key) // 获取到对应的
  if (!dep) return

  // 如果 effect 存在 则执行指定属性对应的函数（依赖触发）
  triggerEffects(dep)
}

/**
 * 依次触发 dep 中保存的依赖
 * @param dep
 */
export function triggerEffects(dep: Dep) {
  const effects = Array.isArray(dep) ? dep : [...dep]
  for (const effect of effects) {
    triggerEffect(effect)
  }
}

export function triggerEffect(effect: ReactiveEffect) {
  if (effect.scheduler) {
    effect.scheduler()
  } else {
    effect.run()
  }
}

import { hasChanged } from '@vue/shared'
import { createDep, Dep } from './dep'
import { activeEffect, trackEffects, triggerEffects } from './effect'
import { toReactive } from './reactive'

export interface Ref<T = any> {
  value: T
}

export function ref(value?: unknown) {
  return createRef(value, false)
}
function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }
  return new RefImpl(rawValue, shallow)
}

class RefImpl<T> {
  private _value: T
  private _rawValue: T

  public dep?: Dep = undefined
  public readonly __v_isRef = true
  constructor(value: T, public readonly __v_isShallow: boolean) {
    this._rawValue = value // 旧值
    this._value = __v_isShallow ? value : toReactive(value)
  }
  get value() {
    trackRefValue(this) // 该函数的目的是为了保存收集到的依赖函数,当简单数据类型通过 obj.value = 'xxx' 时,执行的是 RefImpl 的 setter
    return this._value
  }
  set value(newValue) {
    // setter 方法可以获取到 getter 保存的 dep
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue
      this._value = toReactive(newValue)
      triggerRefValue(this)
    }
  }
}

export function trackRefValue(ref) {
  if (activeEffect) {
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}

/**
 * 是否为 ref
 * @param r
 * @returns
 */
export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true)
}

export function triggerRefValue(ref) {
  if (ref.dep) {
    triggerEffects(ref.dep)
  }
}

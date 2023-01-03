import { isFunction } from '@vue/shared'
import { Dep } from './dep'
import { ReactiveEffect } from './effect'
import { trackRefValue, triggerRefValue } from './ref'

export function computed(getterOrOptions) {
  let getter

  const onlyGetter = isFunction(getterOrOptions)

  if (onlyGetter) {
    getter = getterOrOptions
  }

  const cRef = new ComputedImpl(getter) // cRef => {dep: Set(1) ,__v_isRef: true, _dirty: true, effect: ReactiveEffect}
  return cRef
}

export class ComputedImpl<T> {
  public dep?: Dep = undefined
  private _value!: T
  public readonly effect: ReactiveEffect<T>
  public readonly __v_isRef = true
  public _dirty = true // 为 true 表示需要重新执行 run 方法
  constructor(getter) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
        triggerRefValue(this) // 执行 dep 里面保存的所有函数
      }
    })
    this.effect.computed = this // effect => {computed: ComputedImpl, fn: ƒ, scheduler: ƒ}
  }

  get value() {
    trackRefValue(this) // 将 effect 收集到的函数保存到 dep 中
    if (this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }
    return this._value
  }

  set value(newValue) {}
}

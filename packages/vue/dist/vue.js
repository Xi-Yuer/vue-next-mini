var Vue = (function (exports) {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    var createDep = function (effects) {
        var dep = new Set();
        return dep;
    };

    function effect(fn) {
        var _effect = new ReactiveEffect(fn);
        // 第一次执行
        _effect.run();
    }
    var activeEffect;
    var ReactiveEffect = /** @class */ (function () {
        function ReactiveEffect(fn) {
            this.fn = fn;
        }
        ReactiveEffect.prototype.run = function () {
            // 标记当前被激活的reactive
            activeEffect = this; // this:{fn: ƒ}
            return this.fn();
        };
        return ReactiveEffect;
    }());
    /**
     * 用于保存收集的依赖
     */
    var targetMap = new WeakMap();
    /**
     * 收集依赖(收集的依赖会被保存到 targetMap 中)
     *                              {{target:{ key: activeEffect }}} // activeEffect:为临时保存的值
     *                    weakMap=> { { { name:"Tom"}: {'name':{fn:()=>{} } } } } } :数据结构
     * @param target
     * @param key
     */
    function track(target, key) {
        if (!activeEffect)
            return; // 如果没有保存直接返回
        var depsMap = targetMap.get(target); // {'name':{fn:()=>{} } }
        if (!depsMap) {
            // 如果不存在
            targetMap.set(target, (depsMap = new Map()));
        }
        var dep = depsMap.get(key); // {fn:()=>{} }
        if (!dep) {
            depsMap.set(key, (dep = createDep()));
        }
        trackEffects(dep);
    }
    /**
     * 利用 dep 依次跟踪指定 key 的 所有effect
     */
    function trackEffects(dep) {
        dep.add(activeEffect);
    }
    /**
     * 触发依赖
     * @param target
     * @param key
     * @param value
     */
    function trigger(target, key, newValue) {
        // 触发依赖其实就是执行 targetMap 中对应 effect然后执行对应的函数 fn
        var depsMap = targetMap.get(target);
        if (!depsMap)
            return; // 如果不存在直接返回
        var dep = depsMap.get(key); // 获取到对应的
        if (!dep)
            return;
        // 如果 effect 存在 则执行指定属性对应的函数（依赖触发）
        triggerEffects(dep);
    }
    /**
     * 依次触发 dep 中保存的依赖
     * @param dep
     */
    function triggerEffects(dep) {
        var e_1, _a;
        var effects = Array.isArray(dep) ? dep : __spreadArray([], __read(dep), false);
        try {
            for (var effects_1 = __values(effects), effects_1_1 = effects_1.next(); !effects_1_1.done; effects_1_1 = effects_1.next()) {
                var effect_1 = effects_1_1.value;
                triggerEffect(effect_1);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (effects_1_1 && !effects_1_1.done && (_a = effects_1.return)) _a.call(effects_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    function triggerEffect(effect) {
        effect.run();
    }

    var get = createGetter();
    var set = createSetter();
    var mutableHandles = {
        set: set,
        get: get
    };
    /**
     * 创建并返回一个getter函数
     * @returns
     */
    function createGetter() {
        return function get(target, key, receiver) {
            var res = Reflect.get(target, key, receiver);
            // 依赖收集(收集触发getter函数，以便触发setter时执行该函数)
            track(target, key);
            return res;
        };
    }
    function createSetter() {
        return function set(target, key, value, receiver) {
            var isSet = Reflect.set(target, key, value, receiver);
            // 触发依赖
            trigger(target, key);
            return isSet;
        };
    }

    var reactiveMap = new WeakMap();
    function reactive(target) {
        return createReactiveObject(target, mutableHandles, reactiveMap);
    }
    function createReactiveObject(target, baseHandlers, proxyMap) {
        // 判断是否有缓存(有则直接返回)
        var existingProxy = proxyMap.get(target);
        if (existingProxy) {
            return existingProxy;
        }
        //没有-创建缓存-返回代理对象
        var proxy = new Proxy(target, baseHandlers);
        proxyMap.set(target, proxy);
        return proxy;
    }

    exports.effect = effect;
    exports.reactive = reactive;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=vue.js.map

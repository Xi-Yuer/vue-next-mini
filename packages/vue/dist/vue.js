var Vue = (function (exports) {
    'use strict';

    var isObject = function (value) {
        return value !== null && typeof value === 'object';
    };
    var hasChanged = function (newValue, oldValue) {
        return !Object.is(newValue, oldValue);
    };
    var isFunction = function (val) {
        return typeof val === 'function';
    };

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
        // ???????????????
        _effect.run();
    }
    var activeEffect; // {computed: ComputedImpl, fn: ??, scheduler: ??}
    var ReactiveEffect = /** @class */ (function () {
        function ReactiveEffect(fn, scheduler) {
            if (scheduler === void 0) { scheduler = null; }
            this.fn = fn;
            this.scheduler = scheduler;
        }
        ReactiveEffect.prototype.run = function () {
            // ????????????????????????reactive
            activeEffect = this;
            return this.fn();
        };
        return ReactiveEffect;
    }());
    /**
     * ???????????????????????????
     */
    var targetMap = new WeakMap();
    /**
     * ????????????(?????????????????????????????? targetMap ???)
     *                              {{target:{ key: activeEffect }}} // activeEffect:?????????????????????
     *                    weakMap=> { { { name:"Tom"}: {'name':{fn:()=>{} } } } } } :????????????
     * @param target
     * @param key
     */
    function track(target, key) {
        if (!activeEffect)
            return; // ??????????????????????????????
        var depsMap = targetMap.get(target); // {'name':{fn:()=>{} } }
        if (!depsMap) {
            // ???????????????
            targetMap.set(target, (depsMap = new Map()));
        }
        var dep = depsMap.get(key); // {fn:()=>{} }
        if (!dep) {
            depsMap.set(key, (dep = createDep()));
        }
        trackEffects(dep);
    }
    /**
     * ?????? dep ?????????????????? key ??? ??????effect
     */
    function trackEffects(dep) {
        dep.add(activeEffect);
    }
    /**
     * ????????????
     * @param target
     * @param key
     * @param value
     */
    function trigger(target, key, newValue) {
        // ?????????????????????????????? targetMap ????????? effect??????????????????????????? fn
        var depsMap = targetMap.get(target);
        if (!depsMap)
            return; // ???????????????????????????
        var dep = depsMap.get(key); // ??????????????????
        if (!dep)
            return;
        // ?????? effect ?????? ???????????????????????????????????????????????????
        triggerEffects(dep);
    }
    /**
     * ???????????? dep ??????????????????
     * @param dep
     */
    function triggerEffects(dep) {
        var e_1, _a, e_2, _b;
        var effects = Array.isArray(dep) ? dep : __spreadArray([], __read(dep), false);
        try {
            for (var effects_1 = __values(effects), effects_1_1 = effects_1.next(); !effects_1_1.done; effects_1_1 = effects_1.next()) {
                var effect_1 = effects_1_1.value;
                if (effect_1.computed) {
                    triggerEffect(effect_1);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (effects_1_1 && !effects_1_1.done && (_a = effects_1.return)) _a.call(effects_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        try {
            for (var effects_2 = __values(effects), effects_2_1 = effects_2.next(); !effects_2_1.done; effects_2_1 = effects_2.next()) {
                var effect_2 = effects_2_1.value;
                if (!effect_2.computed) {
                    triggerEffect(effect_2);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (effects_2_1 && !effects_2_1.done && (_b = effects_2.return)) _b.call(effects_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
    }
    function triggerEffect(effect) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }

    var get = createGetter();
    var set = createSetter();
    var mutableHandles = {
        get: get,
        set: set
    };
    /**
     * ?????????????????????getter??????
     * @returns
     */
    function createGetter() {
        return function get(target, key, receiver) {
            var res = Reflect.get(target, key, receiver);
            // ????????????(????????????getter?????????????????????setter??????????????????)
            track(target, key);
            return res;
        };
    }
    function createSetter() {
        return function set(target, key, value, receiver) {
            var isSet = Reflect.set(target, key, value, receiver);
            // ????????????
            trigger(target, key);
            return isSet;
        };
    }

    var reactiveMap = new WeakMap();
    function reactive(target) {
        return createReactiveObject(target, mutableHandles, reactiveMap);
    }
    function createReactiveObject(target, baseHandlers, proxyMap) {
        // ?????????????????????(??????????????????)
        var existingProxy = proxyMap.get(target);
        if (existingProxy) {
            return existingProxy;
        }
        //??????-????????????-??????????????????
        var proxy = new Proxy(target, baseHandlers);
        proxyMap.set(target, proxy);
        return proxy;
    }
    var toReactive = function (value) {
        return isObject(value) ? reactive(value) : value;
    };

    function ref(value) {
        return createRef(value, false);
    }
    function createRef(rawValue, shallow) {
        if (isRef(rawValue)) {
            return rawValue;
        }
        return new RefImpl(rawValue, shallow);
    }
    var RefImpl = /** @class */ (function () {
        function RefImpl(value, __v_isShallow) {
            this.__v_isShallow = __v_isShallow;
            this.dep = undefined;
            this.__v_isRef = true;
            this._rawValue = value; // ??????
            this._value = __v_isShallow ? value : toReactive(value);
        }
        Object.defineProperty(RefImpl.prototype, "value", {
            get: function () {
                trackRefValue(this); // ?????????????????????????????????????????????????????????,??????????????????????????? obj.value = 'xxx' ???,???????????? RefImpl ??? setter
                return this._value;
            },
            set: function (newValue) {
                // setter ????????????????????? getter ????????? dep
                if (hasChanged(newValue, this._rawValue)) {
                    this._rawValue = newValue;
                    this._value = toReactive(newValue);
                    triggerRefValue(this);
                }
            },
            enumerable: false,
            configurable: true
        });
        return RefImpl;
    }());
    function trackRefValue(ref) {
        if (activeEffect) {
            trackEffects(ref.dep || (ref.dep = createDep()));
        }
    }
    /**
     * ????????? ref
     * @param r
     * @returns
     */
    function isRef(r) {
        return !!(r && r.__v_isRef === true);
    }
    function triggerRefValue(ref) {
        if (ref.dep) {
            triggerEffects(ref.dep);
        }
    }

    function computed(getterOrOptions) {
        var getter;
        var onlyGetter = isFunction(getterOrOptions);
        if (onlyGetter) {
            getter = getterOrOptions;
        }
        // cRef => {dep: Set(1) ,__v_isRef: true, _dirty: true, effect: ReactiveEffect}
        var cRef = new ComputedImpl(getter);
        return cRef;
    }
    var ComputedImpl = /** @class */ (function () {
        function ComputedImpl(getter) {
            var _this = this;
            this.dep = undefined;
            this.__v_isRef = true;
            this._dirty = true; // ??? true ???????????????????????? run ??????
            this.effect = new ReactiveEffect(getter, function () {
                if (!_this._dirty) {
                    _this._dirty = true;
                    triggerRefValue(_this); // ?????? dep ???????????????????????????
                }
            });
            // effect => {computed: ComputedImpl, fn: ??, scheduler: ??}
            this.effect.computed = this;
        }
        Object.defineProperty(ComputedImpl.prototype, "value", {
            get: function () {
                trackRefValue(this); // ??? effect ??????????????????????????? dep ???
                if (this._dirty) {
                    this._dirty = false;
                    this._value = this.effect.run();
                }
                return this._value;
            },
            set: function (newValue) { },
            enumerable: false,
            configurable: true
        });
        return ComputedImpl;
    }());

    exports.computed = computed;
    exports.effect = effect;
    exports.reactive = reactive;
    exports.ref = ref;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=vue.js.map

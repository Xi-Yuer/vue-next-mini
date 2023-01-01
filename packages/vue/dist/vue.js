var Vue = (function (exports) {
    'use strict';

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
        var depsMap = targetMap.get(target);
        if (!depsMap) {
            // 如果不存在
            targetMap.set(target, (depsMap = new Map()));
        }
        depsMap.set(key, activeEffect);
    }
    /**
     * 触发依赖
     * @param target
     * @param key
     * @param value
     */
    function trigger(target, key, newValue) {
        // 触发依赖其实就是执行 targetMap 中对应 effect然后执行对应的函数 fn
        console.log('trigger:触发依赖');
        var depsMap = targetMap.get(target);
        if (!depsMap)
            return; // 如果不存在直接返回
        var effect = depsMap.get(key); // 获取到对应的
        if (!effect)
            return;
        // 如果 effect 存在 则执行指定属性对应的函数（依赖触发）
        effect.fn();
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

# 响应式核心
## reactive

1. createReactiveObject 根据 target 创建一个代理对象劫持代理对象的    getter 和 setter并返回该代理对象
2. 收集依赖
    1. 触发代理对象的 getter 返回值的同时收集依赖函数(track)
    2. track 函数根据 target 在 targetMap 中寻找或者保存当前 target 的值 targetMap 的数据结构为：weakMap => {{ {key:value}:{{ key:value }: { fn:()=>void }} }} 
    3. weakMap 保存的值是一个 Map, 该 Map 对应的键是 key 值是 effect 保存的 { fn:() => void }
    4. 将收集到的函数添加到对应值中的 Set 集合中保存

3. 触发依赖
    1. 触发代理对象的 setter 设置值的同时触发收集到的函数依赖
    2. trigger 函数根据 target 找到对应的 Set 集合并依次执行里面的函数

4. 注意：
    1. effect 函数负责保存当前收集到的 fn 函数
    2. 触发代理对象的 getter 时, 将 effect 保存的函数与 getter 的 target 结合，使用 weakMap 保存这个依赖，收集 fn 依赖为一个 Set 集合
    3. 触发代理对象的 setter 时，将 weakMap 中的值根据 target 取出来，并根据 key 找到保存的 fn 集合，并依次执行里面的 fn 函数
    4. 保存的变量核心有两个：
        1. effect 收集到的函数 fn 
        2. 触发 getter 时保存的 weakMap 对象
        3. target 结合 effect 函数保存的变量，组合起来保存到 weakMap 中 


## ref

1. ref 返回的是一个 RefImpl 的实例，该实例有对应 value 的 get 和 set 方法
2. 当通过 object.value 时, 会触发实例的 get 方法，该方法返回的是 reactive 方法返回的对象
3. object.value.xxx 实际上又会触发 reactive 的 getter/setter 中对应的 track/trigger
4. effect 用于收集当前的回调函数并保存,  targetMap 需要用到当前的 ReactiveEffect 来将值保存到 (targetMap:WeakMap) 中
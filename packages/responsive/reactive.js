/* eslint-disable no-prototype-builtins */
/* eslint-disable valid-typeof */
/* eslint-disable no-self-compare */
let activeEffect = null // 当前正在执行的 effect

const effectStack = [] // 保存所有正在执行的 effect

const bucket = new WeakMap() // 保存所有 effect

const p = Promise.resolve() // 用于异步执行

const ITERATE_KEY = Symbol() // 用于for..in循环的唯一key

const reactiveMap = new Map() // 保存所有代理对象

let shouldTrack = true // 是否追踪

// 相应类型
const triggerType = {
  SET: 'SET',
  ADD: 'ADD',
  DELETE: 'DELETE',
}

function effect(fn, options = {}) {
  const effectFn = () => {
    cleanupEffect(effectFn)
    activeEffect = effectFn
    effectStack.push(effectFn)
    const res = fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }
  effectFn.options = options
  effectFn.deps = []

  if (!options.lazy) {
    effectFn()
  }
  return effectFn
}

function cleanupEffect(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

// 计算属性
function computed(getter) {
  let value
  let dirty = true

  const obj = {
    get value() {
      if (dirty) {
        value = effectFn()
        dirty = false
        track(obj, 'value')
      }
      return value
    },
  }

  function effectFn() {
    return effect(getter, {
      lazy: true,
      scheduler() {
        dirty = true
        trigger(obj, 'value')
      },
    })
  }

  return obj
}

// 监听属性
function watch(source, cb, options = {}) {
  let getter
  if (typeof source === 'function') {
    getter = source
  }
  else {
    getter = () => traverse(source)
  }
  let oldValue, newValue, cleanup

  function onInvalidate(fn) {
    cleanup = fn
  }
  const effectFn = effect(() => getter(), {
    scheduler: () => {
      if (options.flush === 'post') {
        p.then(job)
      }
      else {
        job()
      }
    },
    lazy: true,
  })
  function job() {
    newValue = effectFn()
    if (cleanup) {
      cleanup()
    }
    cb(newValue, oldValue, onInvalidate)
    oldValue = newValue
  }

  if (options.immediate) {
    job()
  }
  else {
    oldValue = effectFn()
  }
}

function traverse(source, seen = new Set()) {
  if (typeof source !== 'object' || typeof source === null || seen.has(source))
    return
  seen.add(source)
  for (const key in source) {
    traverse(source[key], seen)
  }
  return source
}

/**
 * target1
 *  - key
 *     - effect1
 *     - effect2
 * target2
 *   - key
 *     - effect3
 *   - key2
 *     - effect4
 */

function track(target, key) {
  // console.log('track: ', target, key)
  if (!activeEffect || !shouldTrack)
    return
  let depsMap = bucket.get(target) // 寻找目标对象
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key) // 寻找目标属性
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect) // 添加副作用函数
  activeEffect.deps.push(deps)
}

function trigger(target, key, type, value) {
  // console.log('trigger: ', target, key)
  const depsMap = bucket.get(target)
  if (!depsMap)
    return
  const deps = depsMap.get(key)
  const effectFnDeps = new Set()
  deps && deps.forEach((dep) => {
    if (dep !== activeEffect) { // 排除当前正在执行的副作用函数
      effectFnDeps.add(dep)
    }
  })
  if (type === triggerType.ADD || type === triggerType.DELETE) {
    const iterateEffects = depsMap.get(ITERATE_KEY)
    iterateEffects && iterateEffects.forEach((effect) => {
      if (effect !== activeEffect) {
        effectFnDeps.add(effect)
      }
    })
  }
  if (type === triggerType.ADD && Array.isArray(target)) {
    const lengthEffects = depsMap.get('length')
    lengthEffects && lengthEffects.forEach((effect) => {
      if (effect !== activeEffect) {
        effectFnDeps.add(effect)
      }
    })
  }

  if (Array.isArray(target) && key === 'length') {
    depsMap.forEach((effects, effectkey) => {
      if (effectkey >= value) {
        effects.forEach((effect) => {
          if (effect !== activeEffect) {
            effectFnDeps.add(effect)
          }
        })
      }
    })
  }

  effectFnDeps.forEach((effect) => {
    if (effect.options.scheduler) { // 执行调度
      effect.options.scheduler(effect)
    }
    else {
      effect()
    }
  }) // 执行副作用函数
}

const arrayInstrumentations = {};
['includes', 'indexOf', 'lastIndexOf'].forEach((method) => {
  const originArrayMethod = Array.prototype[method]
  arrayInstrumentations[method] = function (...args) {
    // 这里的this是代理对象，原始对象是this.raw
    let res = originArrayMethod.apply(this, args)
    if (res === false || res === -1) {
      res = originArrayMethod.apply(this.raw, args)
    }
    return res
  }
})
;['pop', 'push', 'shift', 'unshift', 'splice'].forEach((method) => {
  const originArrayMethod = Array.prototype[method]
  arrayInstrumentations[method] = function (...args) {
    shouldTrack = false
    const res = originArrayMethod.apply(this, args)
    shouldTrack = true
    return res
  }
})

function createReactive(obj, isShallow = false, isReadonly = false) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      // console.log('key: ', key, target)
      if (key === 'raw')
        return target
      if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentations, key, receiver)
      }
      if (!isReadonly && typeof key !== 'symbol') {
        track(target, key)
      }
      const res = Reflect.get(target, key, receiver)
      if (isShallow)
        return res
      if (typeof res === 'object' && res !== null) {
        return isReadonly ? readonly(res) : reactive(res)
      }
      return res
    },
    set(target, key, value, receiver) {
      // console.log('set  key: ', key)
      if (isReadonly) {
        console.error(`Cannot set property on a readonly object:${key}`)
        return false
      }
      const oldValue = target[key]
      const type = Array.isArray(target)
        ? Number(key) < target.length ? triggerType.SET : triggerType.ADD
        : Object.prototype.hasOwnProperty.call(target, key) ? triggerType.SET : triggerType.ADD
      const res = Reflect.set(target, key, value, receiver)
      if (target === receiver.raw) {
        if (oldValue !== value && (oldValue === oldValue || value === value)) {
          trigger(target, key, type, value)
        }
      }
      return res
    },
    has(target, key) {
      track(target, key)
      return Reflect.has(target, key)
    },
    ownKeys(target) {
      // console.log('ownKeys   target: ', target)
      track(target, Array.isArray(target) ? 'length' : ITERATE_KEY)
      return Reflect.ownKeys(target)
    },
    deleteProperty(target, key) {
      if (isReadonly) {
        console.error(`Cannot set property on a readonly object:${key}`)
        return false
      }
      const isOwnKey = Object.prototype.hasOwnProperty.call(target, key)
      const res = Reflect.deleteProperty(target, key)
      if (res && isOwnKey) {
        trigger(target, key, triggerType.DELETE)
      }
    },
  })
}

function shallowReactive(obj) {
  return createReactive(obj, true)
}

function reactive(obj) {
  const existionProxy = reactiveMap.get(obj)
  if (existionProxy) {
    return existionProxy
  }
  const proxy = createReactive(obj)
  reactiveMap.set(obj, proxy)
  return proxy
}

function shallowReadonly(obj) {
  return createReactive(obj, true, true)
}

function readonly(obj) {
  return createReactive(obj, false, true)
}

function ref(value) {
  const wrapper = {
    value,
  }
  // 在对象上挂载一个不可枚举_v_isRef属性，用来标识该对象是一个ref对象
  Object.defineProperty(wrapper, '_v_isRef', {
    value: true,
  })
  return reactive(wrapper)
}

function toRef(obj, key) {
  const wrapper = {
    get value() {
      return obj[key]
    },
    set value(val) {
      obj[key] = val
    },
  }
  Object.defineProperty(wrapper, '_v_isRef', {
    value: true,
  })
  return wrapper
}

function toRefs(obj) {
  const res = {}
  for (const key in obj) {
    res[key] = toRef(obj, key)
  }
  return res
}

function proxyRefs(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver)
      return result._v_isRef ? result.value : result
    },
    set(target, key, newValue, receiver) {
      const value = target[key]
      if (value._v_isRef) {
        value.value = newValue
        return true
      }
      else {
        return Reflect.set(target, key, newValue, receiver)
      }
    },
  })
}

export { computed, effect, proxyRefs, reactive, readonly, ref, shallowReactive, shallowReadonly, toRef, toRefs, watch }

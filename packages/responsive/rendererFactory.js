import getSequence from '../utils/getSequence.js'
import queueJob from '../utils/queueJob.js'
import { Common, Fragment, Text } from './elementType.js'
import { effect, reactive, shallowReactive } from './reactive.js'
/* eslint-disable unicorn/no-new-array */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */

// 简单diff算法
function simplePatchKeyChildren(oldVnode, newVnode, container) {
  const oldChildren = oldVnode.children
  const newChildren = newVnode.children
  let lastIndex = 0 // 用来存储寻找过程中遇到的最大索引值
  for (let i = 0; i < newChildren.length; i++) {
    const newVnode = newChildren[i]
    let find = false // 用来标记是否找到该节点
    for (let j = 0; j < oldChildren.length; j++) {
      const oldVnode = oldChildren[j]
      if (oldVnode.key === newVnode.key) {
        find = true
        patch(oldVnode, newVnode, container)
        if (j < lastIndex) {
          // 说明需要移动节点
          // 获取当前新节点的前一个真实DOM节点
          const prevNode = newChildren[i - 1]
          // 如果当前新节点的前一个真实DOM节点存在，则获取该真实DOM节点的下个真实DOM节点
          // 将该新节点插入到前一个真实DOM节点之后
          if (prevNode) {
            const nextNode = prevNode.el.nextSibling
            insert(newVnode.el, container, nextNode)
          }
        }
        else {
          lastIndex = j
        }
        break
      }
    }
    if (!find) { // 没有找到该节点，说明是新增的节点，则挂载该节点
      const prevNode = newChildren[i - 1]
      let anchor = null
      if (prevNode) {
        anchor = prevNode.el.nextSibling
      }
      else {
        anchor = container.firstChild
      }
      patch(null, newVnode, container, anchor)
    }
  }
  // 上述处理完成之后，需要遍历一遍旧节点，如果存在没有匹配的节点，则卸载该节点
  for (let i = 0; i < oldChildren.length; i++) {
    const hasFind = newChildren.find(item => item.key === oldChildren[i].key)
    if (!hasFind) {
      unmount(oldChildren[i])
    }
  }
}

// 双端diff算法实现
function doublePatchKeyChildren(oldVnode, newVnode, container) {
  const oldChildren = oldVnode.children
  const newChildren = newVnode.children
  // 双端diff算法实现
  let oldStartIndex = 0
  let oldEndIndex = oldChildren.length - 1
  let newStartIndex = 0
  let newEndIndex = newChildren.length - 1
  let oldStartNode = oldChildren[oldStartIndex]
  let oldEndNode = oldChildren[oldEndIndex]
  let newStartNode = newChildren[newStartIndex]
  let newEndNode = newChildren[newEndIndex]
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    // 对头尾节点进行判断，如果不存在，则说明已经处理过了，跳过
    if (!oldStartNode) {
      oldStartNode = oldChildren[++oldStartIndex]
    }
    else if (!oldEndNode) {
      oldEndNode = oldChildren[--oldEndIndex]
    }
    else if (oldStartNode.key === newStartNode.key) {
      // 1 oldStartNode 和 newStartNode 的比较
      patch(oldStartNode, newStartNode, container)
      oldStartNode = oldChildren[++oldStartIndex]
      newStartNode = newChildren[++newStartIndex]
    }
    else if (oldEndNode.key === newEndNode.key) {
      // 2 oldEndNode 和 newEndNode 的比较
      patch(oldEndNode, newEndNode, container)
      oldEndNode = oldChildren[--oldEndIndex]
      newEndNode = newChildren[--newEndIndex]
    }
    else if (oldStartNode.key === newEndNode.key) {
      // 3 oldStartNode 和 newEndNode 的比较
      patch(oldStartNode, newEndNode, container)
      // 将oldStartNode移动到oldEndNode之后
      insert(oldStartNode.el, container, oldEndNode.el.nextSibling)
      // 更新对应的索引
      oldStartNode = oldChildren[++oldStartIndex]
      newEndNode = newChildren[--newEndIndex]
    }
    else if (oldEndNode.key === newStartNode.key) {
      // 4 oldEndNode 和 newStartNode 的比较
      patch(oldEndNode, newStartNode, container)
      // 将oldEndNode移动到oldStartNode之前
      insert(oldEndNode.el, container, oldStartNode.el)
      // 更新对应的索引
      oldEndNode = oldChildren[--oldEndIndex]
      newStartNode = newChildren[++newStartIndex]
    }
    else {
      // 如果以上四种情况都不符合，则我们直接查找新旧节点中是否存在相同的key
      // 找到了就将该节点移动到oldStartNode之前
      const idxInOld = oldChildren.findIndex(item => item.key === newStartNode.key)
      if (idxInOld > 0) {
        patch(oldChildren[idxInOld], newStartNode, container)
        insert(oldChildren[idxInOld].el, container, oldStartNode.el)
        oldChildren[idxInOld] = undefined
      }
      else {
        // 如果找不到，说明是新增节点
        patch(null, newStartNode, container, oldStartNode.el)
      }
      newStartNode = newChildren[++newStartIndex]
    }
  }
  // 新增元素
  // 如果 oldEndIndex < oldStartIndex, 并且 newEndIndex >= newStartIndex, 说明存在没有匹配的新节点，需要挂载
  if (oldEndIndex < oldStartIndex && newEndIndex >= newStartIndex) {
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      patch(null, newChildren[i], container, null)
    }
  }
  else if (newEndIndex < oldEndIndex) {
    // 删除元素
    // 如果 newEndIndex < newStartIndex && oldEndIndex >= oldStartIndex, 说明存在没有匹配的旧节点，需要卸载
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      unmount(oldChildren[i])
    }
  }
}

// 解析props
function resolveProps(options, propsData) {
  const props = {}
  const attrs = {}
  // 遍历传入的props，如果组件的props配置中包含该属性，则该属性是合法的props属性，否则就视为attrs属性
  for (const key in propsData) {
    if (key in options) {
      props[key] = propsData[key]
    }
    else {
      attrs[key] = propsData[key]
    }
  }
  return {
    props,
    attrs,
  }
}
// 是否需要更新props
function hasPropsChange(oldProps, newProps) {
  // 获取新props的key集合
  const newKeys = Object.keys(newProps)
  // 如果新旧props的key集合长度不同，则说明props发生了变化
  if (newKeys.length !== Object.keys(oldProps).length)
    return true
  // 如果长度相同，需要比较值是否发生了变化
  for (const key in newProps) {
    // 如果有不同，则说明props发生了变化
    if (newProps[key] !== oldProps[key]) {
      return true
    }
  }
  return false
}

export function createRenderer(options) {
  const { createElement, setElementText, insert, patchProps, setText, createText, createComment } = options
  // 卸载元素节点
  function unmount(vnode) {
    // 处理Fragment节点
    if (vnode.type === Fragment) {
      vnode.children.forEach(child => unmount(child))
      return
    }
    const parent = vnode.el.parentNode
    if (parent) {
      parent.removeChild(vnode.el)
    }
  }
  // 挂载组件
  function mountComponent(vnode, container, anchor) {
    // 获取组件选项对象
    const componentOptions = vnode.type
    // 获取组件配置
    const { render, data, props: propsOptions, beforeCreate, created, beforeMount, mounted, beforeUpdate, updated } = componentOptions
    // beforeCreate钩子函数调用
    beforeCreate && beforeCreate()
    // 组件自身响应式数据
    const state = reactive(data())
    // 通过resolveProps解析出最终的props和attrs
    const { props, attrs } = resolveProps(propsOptions, vnode.props)

    // 组件实例对象
    const instance = {
      state, // 组件自身状态
      props: shallowReactive(props), // 组件props
      isMounted: false, // 是否已挂载
      subTree: null, // 组件子树
    }
    // 将组建实例挂载到vnode上
    vnode.component = instance

    // 创建组件渲染上下文对象
    const renderContext = new Proxy(instance, {
      get(t, k, r) {
        const { props, state } = t
        if (state && k in state) {
          return state[k]
        }
        else if (k in props) {
          return props[k]
        }
        else {
          console.error(`${k} is not found in component!`)
        }
      },
      set(t, k, v, r) {
        const { state, props } = t
        if (state && k in state) {
          state[k] = v
        }
        else if (k in props) {
          console.warn(`props is readonly!`)
        }
        else {
          console.error(`${k} is not found in component!`)
        }
      },
    })

    // created钩子函数调用
    created && created.call(renderContext)

    // 将组件的render函数包装到effect中，当组件自身状态发生改变时，触发组件更新
    effect(() => {
      // 执行渲染函数，将this设置为组件自身的state
      // render 函数内部可以通过this访问自身状态
      const subTree = render.call(renderContext, renderContext)
      // 如果没有挂载
      if (!instance.isMounted) {
        // beforeMount钩子函数调用
        beforeMount && beforeMount.call(renderContext)
        // 挂载组件
        patch(null, subTree, container, anchor)
        // 更新挂载状态为true，避免重复挂载
        instance.isMounted = true
        // mounted钩子函数调用
        mounted && mounted.call(renderContext)
      }
      else {
        // beforeUpdate钩子函数调用
        beforeUpdate && beforeUpdate.call(renderContext)
        // 如果isMounted为true，说明组件已经挂载过了，则需要更新组件自身状态
        // 所以调用patch函数的时候，第一个参数为组件上一次渲染的子树
        // 即使用新的子树与上一次渲染的子树进行补丁操作
        patch(instance.subTree, subTree, container, anchor)
        // updated钩子函数调用
        updated && updated.call(renderContext)
      }
      // 更新组件子树
      instance.subTree = subTree
    }, {
      // 指定副作用函数的调度器为queueJob
      scheduler: queueJob,
    })
  }
  // 挂载元素节点
  function mountElement(vnode, container, anchor = null) {
    const el = (vnode.el = createElement(vnode.type))
    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children)
    }
    else if (Array.isArray(vnode.children)) {
      vnode.children.forEach((child) => {
        patch(null, child, el)
      })
    }

    if (vnode.props) {
      for (const key in vnode.props) {
        patchProps(el, key, null, vnode.props[key])
      }
    }
    insert(el, container, anchor)
  }
  // 更新组件
  function patchComponent(oldVnode, newVnode, anchor) {
    // 获取组件实例，同时让新的组件虚拟节点指向该组件实例
    const instance = (newVnode.component = oldVnode.component)
    // 获取当前组件实例的props
    const { props } = instance
    if (hasPropsChange(oldVnode.props, newVnode.props)) {
      // 重新获取新的props数据
      const { props: newProps } = resolveProps(newVnode.type.props, newVnode.props)
      // 更新组件的props
      for (const k in newProps) {
        props[k] = newProps[k]
      }
      // 不存在的props属性需要删除
      for (const k in props) {
        if (!(k in newProps)) {
          delete props[k]
        }
      }
    }
  }
  // 更新元素
  function patchElement(oldVnode, newVnode) {
    const el = (newVnode.el = oldVnode.el)
    const oldProps = oldVnode.props || {}
    const newProps = newVnode.props || {}
    // 更新props
    for (const key in newProps) {
      if (oldProps[key] !== newProps[key]) {
        patchProps(el, key, oldProps[key], newProps[key])
      }
    }
    for (const key in oldProps) {
      // eslint-disable-next-line no-unsafe-negation
      if (!key in newProps) {
        patchProps(el, key, oldProps[key], null)
      }
    }
    patchChildren(oldVnode, newVnode, el)
  }
  // 更新子节点
  function patchChildren(oldVnode, newVnode, container) {
    // 子节点只有三种情况
    // 1. 一组子节点
    // 2. 子节点是文本元素
    // 3. 没有子节点
    // 如果新的子节点是文本元素，则卸载旧的子节点，设置新的文本节点
    if (typeof newVnode.children === 'string') {
      if (Array.isArray(oldVnode.children)) {
        oldVnode.children.forEach(child => unmount(child))
      }
      setElementText(container, newVnode.children)
    }
    else if (Array.isArray(newVnode.children)) {
      if (Array.isArray(oldVnode.children)) {
        // 这里需要diff算法进行比较，然后卸载或者挂载
        patchKeyChildren(oldVnode, newVnode, container)
      }
      else {
        // 如果不是数组，则说明子节点是文本元素或者空节点，直接清空容器，然后挂载新的子节点
        setElementText(container, '')
        newVnode.children.forEach(child => patch(null, child, container))
      }
    }
    else {
      // 没有新的子节点，则卸载旧的子节点
      if (Array.isArray(oldVnode.children)) {
        oldVnode.children.forEach(child => unmount(child))
      }
      else {
        setElementText(container, '')
      }
    }
  }
  // diff算法
  function patchKeyChildren(oldVnode, newVnode, container) {
    const oldChildren = oldVnode.children
    const newChildren = newVnode.children
    let j = 0
    let oldEndIndex = oldChildren.length - 1
    let newEndIndex = newChildren.length - 1
    // 从头到尾遍历，如果相同就更新节点，如果不同进行后续的处理
    while (oldChildren[j].key === newChildren[j].key) {
      j++
      patch(oldChildren[j], newChildren[j], container)
    }
    // 从尾到头遍历，如果相同更新节点，如果不同进行后续的处理
    while (oldChildren[oldEndIndex].key === newChildren[newEndIndex].key) {
      patch(oldChildren[oldEndIndex], newChildren[newEndIndex], container)
      oldEndIndex--
      newEndIndex--
    }
    // 如果 j > oldEndIndex，j <= newEndIndex 说明新节点比旧节点多，需要挂载
    if (j > oldEndIndex && j <= newEndIndex) {
      // 获取锚点
      const anchorIndex = newEndIndex + 1
      // 获取锚点元素
      const anchor = anchorIndex < newChildren.length - 1 ? newChildren[anchorIndex].el : null
      // 挂载
      while (j <= newEndIndex) {
        patch(null, newChildren[j++], container, anchor)
      }
    }
    else if (oldEndIndex >= j && newEndIndex < j) {
      // 如果 oldEndIndex >= j，j > newEndIndex 说明旧节点比新节点多，需要卸载
      while (oldEndIndex >= j) {
        unmount(oldChildren[j++])
      }
    }
    // 处理剩余的节点
    else {
      // 构造一个source数组，他的长度是新的一组节点在经过预处理之后剩余需要更新的节点数量
      const count = newEndIndex + 1 - j
      const source = new Array(count)
      source.fill(-1)
      let moved = false // 标记是否移动过节点
      let pos = 0 // 标记遍历旧节点的过程中遇到的最大索引值k
      let patched = 0 // 标记已经更新过的节点的数量
      // 遍历旧节点，如果旧节点的key和新节点key相同，则更新节点，否则标记source数组为-1，表示该节点需要卸载
      // for (let i = j; i <= oldEndIndex; i++) {
      //   const oldVnode = oldChildren[i]
      //   for (let k = j; k <= newEndIndex; k++) {
      //     const newVnode = newChildren[k]
      //     if (oldVnode.key === newVnode.key) {
      //       patch(oldVnode, newVnode, container)
      //       source[k - j] = i
      //     }
      //   }
      // }
      // key索引表
      const keyIndex = {}
      // 遍历新节点，建议key索引表，方便在后续遍历旧节点时，根据key快速定位到新节点
      for (let i = j; i <= newEndIndex; i++) {
        keyIndex[newChildren[i].key] = i
      }
      // 遍历旧节点，如果key索引表中存在该旧节点的key，则更新节点，否则卸载
      for (let i = j; i <= oldEndIndex; i++) {
        const k = keyIndex[oldChildren[i].key]
        // 如果已经更新过的节点数量小于需要更新的节点数量，则执行更新
        if (patched <= count) {
          if (k !== undefined) {
            patch(oldChildren[i], newChildren[k], container)
            // 每更新一个节点，更新patched的值
            patched++
            // 更新source数组
            source[k - j] = i
            // 判断节点是否需要移动
            if (k < pos) {
              moved = true
            }
            else {
              pos = k
            }
          }
          else {
            unmount(oldChildren[i])
          }
        }
        else {
          unmount(oldChildren[i])
        }
      }
      // 如果需要移动节点，则进行移动
      if (moved) {
        // 获取最长递增子序列
        const seq = getSequence(source)
        let i = count - 1 // 新节点中需要处理的节点尾指针
        let s = seq.length - 1 // 最长递增子序列中的尾指针
        for (; i >= 0; i--) {
          // source[i] === -1 说明该节点需要挂载
          if (source[i] === -1) {
            // 找到该节点在新的节点中的位置
            const pos = i + j
            // 获取锚点元素
            const anchor = pos + 1 < newChildren.length ? newChildren[pos + 1].el : null
            // 执行挂载
            patch(null, newChildren[pos], container, anchor)
          }
          if (i !== seq[s]) {
            // 说明节点需要移动
            const pos = i + j
            // 获取锚点元素
            const anchor = pos + 1 < newChildren.length ? newChildren[pos + 1].el : null
            // 执行移动
            insert(newChildren[pos].el, container, anchor)
          }
          else {
            // 说明节点不需要移动，则指针向前移动
            s--
          }
        }
      }
    }
  }
  // 挂载
  function patch(oldVnode, newVnode, container, anchor) {
    // 如果存在旧节点，则判断类型是否一致，不一致则卸载旧节点
    if (oldVnode && oldVnode.type !== newVnode.type) {
      unmount(oldVnode)
      oldVnode = null
    }
    // 普通节点
    if (typeof newVnode.type === 'string') {
      if (!oldVnode) {
        // 不存在旧节点，意味着首次渲染
        mountElement(newVnode, container, anchor)
      }
      else {
        patchElement(oldVnode, newVnode)
      }
    }
    else if (newVnode.type === Text) { // 文本节点
      // 如果没有旧节点，则创建文本节点并插入容器，如果有旧节点，则更新文本内容
      if (!oldVnode) {
        const el = newVnode.el = createText(newVnode.children)
        insert(el, container)
      }
      else {
        const el = newVnode.el = oldVnode.el
        if (oldVnode.children !== newVnode.children) {
          setText(el, newVnode.children)
        }
      }
    }
    else if (newVnode.type === Common) { // 注释节点
      if (!oldVnode) {
        const el = newVnode.el = createComment(newVnode.children)
        insert(el, container)
      }
      else {
        const el = newVnode.el = oldVnode.el
        if (oldVnode.children !== newVnode.children) {
          setText(el, newVnode.children)
        }
      }
    }
    else if (newVnode.type === Fragment) { // 片段节点，针对多根节点
      if (!oldVnode) { // 没有旧节点，直接挂载新的子节点
        newVnode.children.forEach(child => patch(null, child, container))
      }
      else { // 存在旧节点，则更新子节点
        patchChildren(oldVnode, newVnode, container)
      }
    }
    else if (typeof newVnode.type === 'object') { // 组件节点
      if (!oldVnode) {
        // 没有旧节点，则挂载组件
        mountComponent(newVnode, container, anchor)
      }
      else {
        // 存在旧节点，则更新组件
        patchComponent(oldVnode, newVnode, anchor)
      }
    }
  }
  // 渲染函数
  function render(vnode, container) {
    if (vnode) {
      // 有新节点，则进行渲染
      patch(container._vnode, vnode, container)
    }
    else {
      // 没有新节点，或者新节点为空，如果存在旧的节点，则清空容器
      if (container._vnode) {
        unmount(container._vnode)
      }
    }
    // 记录当前渲染的节点
    container._vnode = vnode
  }

  return {
    render,
  }
}

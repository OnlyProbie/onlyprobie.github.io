/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')
export const Common = Symbol('Common')

export function createRenderer(options) {
  const { createElement, setElementText, insert, patchProps, setText, createText, createComment } = options

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
  function patchKeyChildren(oldVnode, newVnode, container) {
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
  }

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

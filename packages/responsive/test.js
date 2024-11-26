import { createRenderer, Text } from './renderer.js'
// import { ref, effect } from './responsive/reactive.js'

// const { effect, ref } = Vue

// 针对只读属性的处理，只能通过setAttribute来设置
// eslint-disable-next-line unused-imports/no-unused-vars
function shouldSetAsProps(el, key, value) {
  if (key === 'form' || el.tagName === 'INPUT')
    return false
  return key in el
}

const { render } = createRenderer({
  createElement(type) {
    return document.createElement(type)
  },
  setElementText(el, text) {
    el.textContent = text
  },
  setText(el, text) {
    el.nodeValue = text
  },
  createText(text) {
    return document.createTextNode(text)
  },
  createConment(commonText) {
    return document.createComment(commonText)
  },
  insert(el, container, anchor = null) {
    // container.appendChild(el)
    container.insertBefore(el, anchor)
  },
  patchProps(el, key, oldValue, newValue) {
    if (key === 'class') {
      el.className = newValue
    }
    if (key === 'style') {
      el.style = newValue
    }
    if (key.startsWith('on')) {
      const invokers = el._vei || (el._vei = {})
      let invoker = invokers[key]
      const name = key.slice(2).toLowerCase()
      if (newValue) {
        if (!invoker) {
          invoker = el._vei[key] = (e) => {
            if (Array.isArray(newValue)) {
              invoker.value.forEach(fn => fn(e))
            }
            else {
              invoker.value(e)
            }
          }
          invoker.value = newValue
          el.addEventListener(name, invoker)
        }
        else {
          invoker.value = newValue
        }
      }
      else if (invoker) {
        el.removeEventListener(name, invoker)
      }
    }
    if (shouldSetAsProps(el, key, newValue)) {
      const type = typeof el[key]
      if (type === 'boolean' && newValue === '') {
        el[key] = true
      }
      else {
        el[key] = newValue
      }
    }
    else {
      el.setAttribute(key, newValue)
    }
  },
})

const n1 = {
  type: 'div',
  children: [
    {
      type: 'p',
      children: '我是原来的2',
      key: 2,
    },
    {
      type: 'p',
      children: '我是原来的3',
      key: 3,
    },
    {
      type: 'p',
      children: '我是原来的1',
      key: 1,
    },
  ],
}

const n2 = {
  type: 'div',
  children: [
    {
      type: 'p',
      children: '我是原来的3',
      key: 3,
    },
    {
      type: 'p',
      children: '我是原来的2',
      key: 2,
    },
    {
      type: 'div',
      children: '我是原来的1',
      key: 4,
    },
    {
      type: 'p',
      children: [
        {
          type: Text,
          children: '我是原来的1',
        },
        {
          type: 'text',
          children: '我是原来的1',
        },
      ],
      key: 1,
    },
  ],
}

render(n1, document.getElementById('app'))
render(n2, document.getElementById('app'))

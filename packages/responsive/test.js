import { Text } from './elementType.js'
import render from './render.js'

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

const MyComponent = {
  name: 'my-component',
  props: {
    title: String,
  },
  data() {
    return {
      name: 'my-component',
      age: 18,
    }
  },
  render() {
    return {
      type: 'div',
      children: [
        {
          type: 'p',
          children: `name: ${this.name}, age: ${this.age}, title: ${this.title}`,
        },
      ],
    }
  },
}

const VComponent = {
  type: MyComponent,
  props: {
    title: 'A big title',
    // other: this.val,
  },
}

render(VComponent, document.getElementById('app1'))

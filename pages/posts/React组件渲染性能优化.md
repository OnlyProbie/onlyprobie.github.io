---
title: React组件渲染性能优化
date: 2024-11-19T08:48:55
lang: zh-CN
type: blog
duration: 15min
---

[[toc]]

# shouldComponentUpdate 

应用于类组件中，根据返回值来决定是否要重新渲染，默认为`true`，需要重新渲染，如果返回`false`，则不会重新渲染

接受两个参数，新的`props`和新的`state`

需要将当前的`props`和`state`，与新的`props`和`start`进行一个比较，当新旧`props`和`state`都是相同的，则返回`false`，不需要重新渲染

```js
/**
 * 对两个对象进行一个浅比较
 */

function objectEqual(obj1, obj2) {
    for (let key in obj1) {
        if (!Object.is(obj1[key], obj2[key])) {
            return false
        }
    }
    return true
}
```

# React.PureComponent

应用于类组件，跳过不必要的重新渲染，继承了`PureComponent`的子类相当于定义了一个自定义的`shouldComponentUpdate`方法，该方法将浅比较 `props` 和 `state`



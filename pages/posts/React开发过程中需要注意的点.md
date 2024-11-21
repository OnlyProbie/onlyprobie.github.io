---
title: React开发过程中需要注意的点
date: 2024-11-14T16:23:10
lang: zh-CN
type: daily
duration: 10min
---

[[toc]]

## 需要注意的点

1、setState对于状态的改变有可能是异步的

如果改变状态的代码处于某个html元素的事件中，则其是异步的，否则是同步

最佳实践：

 - 把所有的setState当作是异步的
 - 永远不要相信setState调用之后的状态
 - 如果要使用改变之后的状态，需要使用回调函数（setState的第二个参数）
 - 如果新的状态要根据之前的状态进行运算，使用函数的方式改变状态（setState的第一个函数）

2、React会对setState进行优化，将多次setState调用进行合并（将多次状态改变完成后，在统一对state进行更新，然后执行render）

3、受控组件和非受控组件的使用场景

https://goshacmd.com/controlled-vs-uncontrolled-inputs-react/

4、函数式编程和命令式编程的区别

https://www.imaginarycloud.com/blog/functional-programming-vs-oop

## 问题：

1、constructor为啥会执行两次 ？

这个问题出现的“罪魁祸首”就是 React.StrictMode，它在开发环境中将 constructor 函数调用了两次，至于为什么调用两次？其实为了检测意外的副作用，通过调用两次的方式将一些隐藏地比较深的副作用放大，让开发者更好的发现它。
https://juejin.cn/post/6844904084768587790
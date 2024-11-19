---
title: ResolveFactory浅析
date: 2023-11-14T18:21:13
lang: zh-CN
type: blog
duration: 10min
description: ResolveFactory 解析器钩子函数
---

[[toc]]

1、ensureHook 的作用是确保给定的hook存在，并且返回该hook的引用

内部实现是创建了一个 AsyncSeriesBailHook 的实例（理解 tapable库）。

```jsx
resolver.ensureHook("resolve"); // 在解析过程开始时触发，用于解析模块的绝对路径
resolver.ensureHook("internalResolve"); // 在内部解析过程开始时触发，用于解析内部模块的路径
resolver.ensureHook("newInternalResolve"); // 在新的内部解析过程开始时触发，用于解析新的内部模块路径
resolver.ensureHook("parsedResolve"); // 在解析过程中，路径已被解析为请求对象时触发，用于处理解析后的请求对象
resolver.ensureHook("describedResolve"); // 在解析过程中请求对象已被描述时触发，可以用于处理描述后的请求对象
resolver.ensureHook("rawResolve"); // 在原始解析过程开始时触发，开始解析一个原始请求
resolver.ensureHook("normalResolve"); // 在常规解析过程开始时触发，开始解析一个常规的请求。
resolver.ensureHook("internal"); // 在解析内部模块时触发，可以用于处理内部模块的解析。
resolver.ensureHook("rawModule"); // 在解析原始模块时触发，可以用于处理原始模块的解析。
resolver.ensureHook("module"); // 在解析模块时触发，可以用于处理模块的解析
resolver.ensureHook("resolveAsModule");  // 在将路径解析为模块时触发，可以用于处理模块路径的解析。
resolver.ensureHook("undescribedResolveInPackage"); // 在解析包内未描述的请求时触发，可以用于处理包内未描述请求的解析。
resolver.ensureHook("resolveInPackage"); // 在解析包内的请求时触发，可以用于处理包内请求的解析。
resolver.ensureHook("resolveInExistingDirectory"); // 在解析已存在目录中的请求时触发，可以用于处理已存在目录中请求的解析。
resolver.ensureHook("relative"); // 在解析相对路径时触发，可以用于处理相对路径的解析。
resolver.ensureHook("describedRelative"); // 在解析已描述的相对路径时触发，可以用于处理已描述的相对路径的解析
resolver.ensureHook("directory"); // 在解析目录时触发，可以用于处理目录的解析。
resolver.ensureHook("undescribedExistingDirectory"); // 在解析未描述的已存在目录时触发，可以用于处理未描述的已存在目录的解析。
resolver.ensureHook("existingDirectory"); // 在解析已存在目录时触发，可以用于处理已存在目录的解析。
resolver.ensureHook("undescribedRawFile"); // 在解析未描述的原始文件时触发，可以用于处理未描述的原始文件的解析。
resolver.ensureHook("rawFile"); // 在解析原始文件时触发，可以用于处理原始文件的解析。
resolver.ensureHook("file"); // 在解析文件时触发，可以用于处理文件的解析。
resolver.ensureHook("finalFile"); // 在解析最终文件时触发，可以用于处理最终文件的解析。
resolver.ensureHook("existingFile"); // 在解析已存在文件时触发，可以用于处理已存在文件的解析。
resolver.ensureHook("resolved"); // 在解析过程结束时触发，可以用于处理解析结束后的操作。
```

基于以上，实现类似 webpack alias 的功能插件：
```jsx
// 默认别名映射
const defaultAliasMap = {
  'src/components/intercity-sellout/index': 'src/components/button/index',
}

// 获取别名映射
function getAliasMap (alias) {
  const aliasMap = new Map()
  Object.keys(alias).forEach((key) => {
    aliasMap.set(key, alias[key])
  })
  return aliasMap
}

class MpxUIResolverAliasPlugin {
  constructor(options = {}) {
    const alias = options.alias ?  Object.assign({}, defaultAliasMap, options.alias) : defaultAliasMap
    this.alias = getAliasMap(alias)
  }

  apply(resolver) {
    const target = resolver.ensureHook('resolve');
    resolver.getHook('described-resolve').tapAsync('MpxUIResolverAliasPlugin', (request, resolveContext, callback) => {
      let hasAlias = false; // 用来标识是否匹配到别名
      let aliasRequestPath = this.alias.get(request.request)
      if (aliasRequestPath) {
        hasAlias = true;
        const obj = Object.assign({}, request, { request: aliasRequestPath });
        return resolver.doResolve(target, obj, null, resolveContext, callback);
      }
      if (!hasAlias) {
        return callback(); // 调用回调函数
      }
    });
  }
}

module.exports = MpxUIResolverAliasPlugin;
```

2、内部通过resolver.doResolve方法调用hook，找到订阅对应hook的plugin并执行，后续也是通过resolver.doResolve方法调用后续的hook。

3、NextPlugin 的作用是推进hook的执行流程，传递数据。
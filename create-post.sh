#!/bin/bash

# 检查是否提供了文件名参数
if [ $# -eq 0 ]; then
    echo "Usage: $0 <post-name>"
    exit 1
fi

# 定义数组
arr=("blog" "daily" "design" "thinking" "interest")

type=$1

# 获取文件类型和文件名
if echo "${arr[@]}" | grep -wq "$type"; then
    filename=$2
    filetype=$type
else
    filename=$type
    filetype='blog'
fi

# 将文件名转换为标题格式
title=$(echo $filename | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++)sub(/./,toupper(substr($i,1,1)),$i)}1')

# 获取当前时间并格式化为 ISO 8601 格式 (YYYY-MM-DDThh:mm:ss)
date=$(date "+%Y-%m-%dT%H:%M:%S")

# 创建文件名（确保有.md后缀）
if [[ $filename != *.md ]]; then
    filename="${filename}.md"
fi

# 创建文档路径
post_path="pages/posts/$filename"

# 生成文档内容
cat > "$post_path" << EOF
---
title: ${title}
date: ${date}
lang: zh-CN
type: ${filetype}
duration: 15min
---

[[toc]]

EOF

echo "Created new post at: $post_path"
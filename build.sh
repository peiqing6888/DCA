#!/bin/bash

# 清理之前的构建
rm -rf .next

# 安装依赖
npm install

# 运行构建
npm run build 
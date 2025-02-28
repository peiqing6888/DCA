#!/bin/bash

# 检查虚拟环境是否存在
if [ ! -d "venv" ]; then
    echo "虚拟环境不存在，请先运行 setup.sh"
    exit 1
fi

# 激活虚拟环境
source venv/bin/activate

# 启动服务
echo "启动后端服务..."
uvicorn main:app --host 127.0.0.1 --port 8000 --reload 
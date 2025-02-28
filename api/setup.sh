#!/bin/bash

# 检查Python版本
python3 --version || { echo "请先安装Python 3"; exit 1; }

# 创建虚拟环境
echo "创建虚拟环境..."
python3 -m venv venv

# 激活虚拟环境
echo "激活虚拟环境..."
source venv/bin/activate

# 升级pip
echo "升级pip..."
pip install --upgrade pip

# 安装依赖
echo "安装项目依赖..."
pip install -r requirements.txt

echo "虚拟环境设置完成！"
echo "使用以下命令启动服务："
echo "source venv/bin/activate"
echo "uvicorn main:app --host 0.0.0.0 --port 8000 --reload" 
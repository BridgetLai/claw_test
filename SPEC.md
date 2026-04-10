# Recall Timer - 遗忘曲线复习提醒插件

## 项目概述
- **项目名称**: Recall Timer (记忆回顾定时器)
- **类型**: 浏览器插件 (Chrome/Edge/Firefox)
- **核心功能**: 根据艾宾浩斯遗忘曲线一键设置多个复习提醒闹钟
- **目标用户**: 学生、高强度学习者

## 艾宾浩斯遗忘曲线时间节点
基于科学记忆规律，推荐复习时间点：
- 5分钟 → 30分钟 → 12小时 → 1天 → 3天 → 7天 → 15天 → 30天

## 功能清单

### 1. 预设遗忘曲线模式
- 一键启动完整的遗忘曲线复习计划
- 自动计算所有复习节点并设置闹钟

### 2. 自定义间隔模式
- 用户指定间隔（如1小时、2小时、3小时）
- 设置重复次数
- 生成多个闹钟

### 3. 闹钟管理
- 查看所有待提醒列表
- 取消单个或全部闹钟
- 浏览器通知 + 声音提醒

### 4. 数据持久化
- 使用 localStorage 保存闹钟数据
- 刷新页面后闹钟依然有效

## 技术实现
- 纯 HTML/CSS/JavaScript
- 使用 Browser Notifications API
- 使用 setTimeout/requestAnimationFrame 模拟定时任务
- localStorage 持久化

## 文件结构
```
recall-timer/
├── manifest.json      # 插件配置
├── popup.html         # 弹窗界面
├── popup.js           # 弹窗逻辑
├── background.js      # 后台服务（可选）
└── icon.png           # 插件图标
```

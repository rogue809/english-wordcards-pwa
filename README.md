# 英语单词卡片应用

一个简单的英语单词学习 PWA 应用，支持移动设备，并可通过 GitHub Pages 访问。

## 功能

- 创建和管理英语单词卡片
- 移动端优先的响应式设计
- 离线工作（PWA）
- 自动备份到 GitHub Gist
- 可安装到主屏幕

## 技术栈

- HTML5
- CSS3
- JavaScript (原生)
- PWA (Progressive Web App)
- Service Worker
- GitHub Pages
- GitHub Gist API (用于备份)

## 使用方法

1. 访问应用主页：`https://你的用户名.github.io/英语单词卡片/`
2. 点击"添加卡片"按钮创建新的单词卡片
3. 点击卡片可以查看单词的详细信息
4. 点击"同步备份"按钮将数据备份到 GitHub Gist
5. 点击"安装应用"按钮（如果可用）将应用安装到主屏幕

## 首次使用设置

1. 创建 GitHub 个人访问令牌（Personal Access Token）
   - 访问 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - 点击 "Generate new token"
   - 勾选 "gist" 权限
   - 点击 "Generate token"
   - 复制生成的令牌
   
2. 首次点击"同步备份"按钮时，输入你的 GitHub 访问令牌

## 开发指南

### 本地开发

1. 克隆仓库：
   ```
   git clone https://github.com/你的用户名/英语单词卡片.git
   ```

2. 安装必要的工具（用于图标生成等）：
   ```
   npm install -g svgexport
   ```

3. 使用本地服务器运行应用：
   ```
   npx http-server
   ```

### 部署到 GitHub Pages

1. Fork 或创建一个新的仓库
2. 上传所有文件到主分支
3. GitHub Actions 会自动部署到 GitHub Pages
4. 访问 `https://你的用户名.github.io/仓库名/` 查看应用

## 文件结构

- `index.html` - 主HTML文件
- `styles.css` - 样式表
- `app.js` - 主要的JavaScript逻辑
- `service-worker.js` - PWA的Service Worker
- `manifest.json` - PWA清单文件
- `icons/` - 应用图标
- `.github/workflows/deploy.yml` - GitHub Actions部署配置
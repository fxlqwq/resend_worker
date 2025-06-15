# 高级邮件发送器 (由 Cloudflare Workers & Resend 驱动)

这是一个功能强大的前端邮件发送器，它利用 Cloudflare Workers 作为安全的后端代理，通过 Resend 服务来发送邮件。这个项目将一个单页的 HTML 文件与一个 Cloudflare Worker 脚本结合，实现了一个完全无服务器化、安全且功能丰富的邮件发送解决方案。

前端界面使用了 [Pico.css](https://picocss.com/)，实现了简洁、美观且响应式的设计，并支持深色/浅色模式切换。

## ✨ 主要功能

  - **安全架构**: 用户的 Resend API Key 存储在 Cloudflare Worker 的环境变量中，绝不暴露给前端，保证了密钥安全。
  - **丰富的邮件编辑器**:
      - **所见即所得**: 提供 HTML 内容实时预览功能。
      - **格式工具栏**: 快速添加粗体、斜体、链接和内联图片。
      - **图片内嵌**: 支持从本地选择图片并将其作为 Base64 直接嵌入到邮件内容中，无需上传到外部图床。
  - **完整的邮件功能**:
      - 支持多个收件人（To）、抄送（CC）和密送（BCC）。
      - 支持添加附件（文件被编码为 Base64 发送）。
      - **定时发送**: 可以选择未来的一个时间点来安排邮件发送。
  - **本地化数据管理**:
      - **发送历史**: 所有发送记录（成功或失败）都保存在浏览器的 `localStorage` 中，方便追溯。
      - **草稿箱**: 可以随时将当前编辑的邮件保存为草稿，或从 `localStorage` 加载草稿。
      - **历史详情**: 点击历史记录可以查看邮件的完整详情，包括内容预览。
  - **用户体验优化**:
      - **密码保护**: 整个应用由一个密码保护，密码哈希存储在前端，增加了安全性。
      - **主题切换**: 支持一键切换深色/浅色主题。
      - **可配置**: 可以在前端设置页面中轻松配置 Worker URL 和默认发件人地址。

## 🏛️ 技术架构

本项目采用前后端分离的模式：

1.  **前端 (`index.html`)**:

      * 一个独立的 HTML 文件，包含了所有 UI、逻辑和样式。
      * 用户在浏览器中填写邮件信息。
      * 当点击发送时，它会将邮件数据（包括编码后的附件）打包成 JSON 格式。
      * 通过 `fetch` API 将 JSON 数据发送到您的 Cloudflare Worker URL。

2.  **后端 (`worker.js`)**:

      * 部署在 Cloudflare 全球网络上的 Serverless 函数。
      * 接收来自前端的 POST 请求。
      * 处理 CORS 跨域请求。
      * 从环境变量中安全地读取 `RESEND_API_KEY`。
      * 将前端发送的数据与 API Key 组合，向 Resend官方 API (`https://api.resend.com/emails`) 发起请求。
      * 将 Resend API 的响应原样返回给前端，前端根据响应结果向用户显示成功或失败信息。

这个架构的优点是：您无需拥有自己的服务器，部署简单，且 Cloudflare 的全球网络保证了访问速度和稳定性。

```
[您的浏览器 (index.html)]  <---JSON--->  [Cloudflare Worker (worker.js)]  <---JSON with API Key--->  [Resend API]
```

## 🚀 部署指南

按照以下步骤，您可以在 5 分钟内完成部署。

### 前提条件

1.  拥有一个 **Cloudflare 账户**。
2.  拥有一个 **Resend 账户** ([https://resend.com/](https://resend.com/))。
3.  在 Resend 中**验证一个您有权使用的域名**，用于作为发件人地址。

### 步骤 1: 配置并部署 Cloudflare Worker

1.  登录到您的 Cloudflare 仪表板。
2.  在左侧菜单中，进入 **Workers & Pages**。
3.  点击 **Create application** \> **Create Worker**。
4.  为您的 Worker 命名（例如 `email-sender`），然后点击 **Deploy**。
5.  部署成功后，点击 **Edit code**。
6.  删除编辑器中的所有模板代码，将 `worker.js` 的全部内容粘贴进去。
7.  返回 Worker 的配置页面，进入 **Settings** \> **Variables**。
8.  在 **Environment Variables** 部分，添加一个秘密变量（Secret variable）：
      * **Variable name**: `RESEND_API_KEY`
      * **Value**: 点击 **Encrypt** 并粘贴您从 Resend 获取的 API Key。
9.  点击 **Save and Deploy**。部署完成后，记下您的 Worker URL（例如 `https://email-sender.your-name.workers.dev`）。

### 步骤 2: 设置前端页面

`index.html` 文件是自包含的，您可以直接用浏览器打开它，或者将其托管在任何地方（例如 Cloudflare Pages, GitHub Pages, 或您自己的服务器上）。

1.  **设置访问密码**:

      * 用文本编辑器打开 `index.html` 文件。
      * 找到第 `180` 行左右的 `config` 对象：
        ```javascript
        let config = { WORKER_URL: '...', FROM_EMAIL: '...', PWD_HASH: 'd8fb238cc20a874529801c28771ed39acde486da770113565862e6c549cfd841' };
        ```
      * 您需要为您自己的密码生成一个新的 SHA-256 哈希值。最简单的方法是：
        a.  用浏览器打开 `index.html` 文件。
        b.  按 `F12` 打开开发者工具，切换到 `Console` (控制台) 标签。
        c.  在控制台中输入以下命令，并将 `your-secret-password` 替换为您想设置的密码，然后按回车：
        ` javascript await textToHash('your-secret-password')  `
        d.  控制台会输出一长串哈希字符串。将这个字符串复制并替换掉 `PWD_HASH` 的值。
      * **（可选）** 您也可以在此处直接修改 `WORKER_URL` 和 `FROM_EMAIL` 的默认值。

2.  **配置应用**:

      * 用浏览器打开 `index.html` 文件。
      * 输入您刚刚设置的密码以解锁应用。
      * 点击页面右上角的齿轮图标 `⚙️` 打开设置。
      * 在 **Worker URL** 中，填入您在步骤 1 中获得的 Worker URL。
      * 在 **默认发件人地址** 中，填入一个您在 Resend 中验证过的发件人地址（格式建议为 `你的名字 <noreply@your-verified-domain.com>`）。
      * 点击 **保存设置**。您的配置会保存在浏览器的 `localStorage` 中，下次打开时会自动加载。

现在，您的个人高级邮件发送器已经准备就绪！

## 📂 文件说明

  - `index.html`: 前端应用的全部代码。它是一个独立的、无需构建的 HTML 文件，包含了界面、样式和交互逻辑。
  - `worker.js`: Cloudflare Worker 的后端脚本。它负责处理前端请求、验证数据、添加 API 密钥并与 Resend API 通信。

## 📄 许可证

本项目采用 [MIT License](https://opensource.org/licenses/MIT) 授权。

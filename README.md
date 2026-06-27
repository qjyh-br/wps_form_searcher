<!-- markdownlint-disable MD033 MD041 -->
<p align="center">
</p>

<p align="center">
  <img alt="Tampermonkey" src="https://img.shields.io/badge/Tampermonkey-4.0+-blue?logo=tampermonkey">
  <img alt="platform" src="https://img.shields.io/badge/platform-Web%20(Chrome%2FEdge%2FFirefox)-blueviolet">
  <img alt="license" src="https://img.shields.io/github/license/qjyh-br/wps_form_searcher">
  <br>
  <img alt="version" src="https://img.shields.io/badge/version-3.1-brightgreen">
  <img alt="stars" src="https://img.shields.io/github/stars/qjyh-br/wps_form_searcher?style=social">
</p>

<div align="center">

# WPS 表单签到检查器

一个油猴脚本，帮助你在 WPS 表单中**批量检查**签到情况，支持**统计**和**数据导出**。

</div>

## 📸 功能预览

### 1. 进入搜索界面
在 WPS 表单页面中点击搜索按钮，进入数据搜索界面

![进入搜索界面](https://cdn.jsdelivr.net/gh/qjyh-br/pic-bed@main/wps_form_searcher/1.png)

### 2. 悬浮窗控制
右下角悬浮窗支持 **显示/最小化** 切换

![悬浮窗显示与最小化](https://cdn.jsdelivr.net/gh/qjyh-br/pic-bed@main/wps_form_searcher/2.png)

### 3. 批量搜索与导出
支持输入**搜索列表**和**统计名单**,一键检查并导出结果

![批量搜索与导出](https://cdn.jsdelivr.net/gh/qjyh-br/pic-bed@main/wps_form_searcher/3.png)

### 4. 在搜索界面启动
⚠️ **重要提示**：脚本必须在 WPS 表单的**搜索界面**中启动才能正常工作

![在搜索界面启动](https://cdn.jsdelivr.net/gh/qjyh-br/pic-bed@main/wps_form_searcher/4.png)

## ✨ 主要功能

- 🔍 **批量搜索** – 支持输入多个搜索项，依次自动搜索
- 📊 **智能统计** – 从搜索结果中过滤出指定名单成员的签到状态（✅已填 / ❌未填）
- 💾 **配置持久化** – 搜索列表和统计名单自动保存到浏览器 `localStorage`，关闭页面后不丢失
- 📥 **数据导出** – 支持导出全部搜索数据和统计名单签到结果（CSV 格式）
- 🖥️ **悬浮窗交互** – 右下角悬浮窗，支持显示/最小化

## 🚀 快速开始

1. **安装油猴插件**  
   - Chrome: [Tampermonkey](https://www.tampermonkey.net/)  
   - Firefox: [Violentmonkey](https://violentmonkey.github.io/)

2. **安装脚本**  
   - 点击 [这里](https://greasyfork.org/zh-CN) 搜索 “WPS表单签到检查器” 安装，或直接导入 `wps-form-checker.js`。

3. **使用**  
   - 打开任意 WPS 表单页面（`https://f.wps.cn/ksform/*`）  
   - **点击表单中的搜索按钮，进入搜索界面**（必须）  
   - 右下角出现悬浮窗，配置搜索列表和统计名单  
   - 点击「开始检查」，等待脚本自动完成  
   - 点击「导出全部」或「导出统计」下载 CSV 结果

## ⚙️ 配置说明

| 配置项 | 说明 | 示例 |
|--------|------|------|
| 搜索列表 | 每行一个搜索关键词 | `M51`<br>`M52` |
| 统计名单 | 每行一个姓名，从搜索结果中筛选 | `张三`<br>`李四` |

> 💡 配置可以保存在浏览器中，下次打开页面无需重新输入。

## 📄 导出格式

导出的 CSV 文件包含三列：**学号、姓名、签到状态**。

| 学号 | 姓名 | 签到状态 |
|------|------|----------|
| M520 | 张三 | 已签到 |
| M521 | 李四 | 未签到 |

## ❓ 常见问题

**Q：为什么脚本没有出现？**  
A：请确保你已进入 WPS 表单的**搜索界面**（即页面有搜索框和成员列表）。脚本仅在 `https://f.wps.cn/ksform/*` 页面生效。

**Q：搜索后结果不更新？**  
A：可能是网络较慢，可在脚本中调大 `await sleep(2000)` 的等待时间（单位毫秒）。

**Q：如何删除保存的配置？**  
A：在浏览器控制台（F12）控制台(console)执行 `localStorage.removeItem('wps_checker_config')` 即可重置。

## 📝 许可证

[MIT](LICENSE) © qjyh-br

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

# MONO · 黑白之间

本地运行的纯色 Logo / 二维码黑白转换工具。无构建依赖，无服务器图片上传。

直接用浏览器打开 `index.html`，或运行 `node server.cjs`，访问 http://127.0.0.1:4173。

支持文件选择、拖放、粘贴图片；PNG / JPG / WEBP / SVG 输入；黑白前景与透明 / 黑白背景；原始像素尺寸 PNG 导出。透明素材默认保留 alpha，实色底素材从边缘识别底色，也可展开“原图前景识别”手动选择。切换实色背景时会自动保持黑白对比。

面向纯色图形，不提供多色照片抠图。SVG 输入会栅格化为 PNG。图片上限 30 MB / 2000 万像素 / 单边 16384 px。部分扫码应用不支持白色二维码，实际投放前需测试扫码。

示例二维码内容为 `https://example.com`，矩阵由 [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 生成，无运行时第三方依赖。转换使用浏览器 [Canvas 像素 API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData)。

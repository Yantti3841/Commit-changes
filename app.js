const $ = (id) => document.getElementById(id);
const original = $('original');
const result = $('result');
const state = { foreground: 'white', background: 'black', source: 'auto' };
let pixels, hasTransparency, inferredSource, filename, loadVersion = 0;

function rememberImage(name) {
  pixels = original.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, original.width, original.height);
  hasTransparency = false;
  let borderLight = 0, borderCount = 0;
  const { data, width, height } = pixels;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 250) hasTransparency = true;
    const index = i / 4, x = index % width, y = Math.floor(index / width);
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
      borderLight += (data[i] + data[i + 1] + data[i + 2]) / 3;
      borderCount++;
    }
  }
  inferredSource = borderLight / borderCount > 127 ? 'black' : 'white';
  filename = name;
  state.source = 'auto';
  $('metadata').textContent = `${name} · ${width} × ${height} px`;
  $('message').textContent = '';
  render();
}

function render() {
  if (!pixels) return;
  const { data, width, height } = pixels;
  result.width = width;
  result.height = height;
  const context = result.getContext('2d');
  const output = context.createImageData(width, height);
  const color = state.foreground === 'white' ? 255 : 0;
  const background = state.background === 'white' ? 255 : 0;
  const useAlpha = hasTransparency && state.source === 'auto';
  const source = state.source === 'auto' ? inferredSource : state.source;
  for (let i = 0; i < data.length; i += 4) {
    const light = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    const alpha = data[i + 3] / 255 * (useAlpha ? 1 : source === 'white' ? light : 1 - light);
    const value = state.background === 'transparent' ? color : color * alpha + background * (1 - alpha);
    output.data[i] = output.data[i + 1] = output.data[i + 2] = value;
    output.data[i + 3] = state.background === 'transparent' ? alpha * 255 : 255;
  }
  context.putImageData(output, 0, 0);
  $('result-frame').classList.toggle('checker', state.background === 'transparent');
  $('result-frame').style.backgroundColor = state.background === 'transparent' ? '' : state.background === 'black' ? '#000' : '#fff';
  $('detected').textContent = useAlpha ? '透明图形' : `${source === 'black' ? '黑色' : '白色'}前景`;
  document.querySelectorAll('[data-setting]').forEach(group => {
    group.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.value === state[group.dataset.setting])));
  });
}

document.querySelectorAll('[data-setting]').forEach(group => {
  group.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const setting = group.dataset.setting, value = button.dataset.value;
    state[setting] = value;
    // A solid background must contrast with the graphic.
    if (setting === 'foreground' && state.background === value) state.background = value === 'black' ? 'white' : 'black';
    if (setting === 'background' && value === state.foreground) state.foreground = value === 'black' ? 'white' : 'black';
    $('message').textContent = '';
    render();
  });
});
$('swap').addEventListener('click', () => {
  state.foreground = state.foreground === 'black' ? 'white' : 'black';
  if (state.background !== 'transparent') state.background = state.background === 'black' ? 'white' : 'black';
  $('message').textContent = '';
  render();
});

async function loadFile(file) {
  if (!file) return;
  const version = ++loadVersion;
  const allowed = /\.(png|jpe?g|webp|svg)$/i.test(file.name) || /^(image\/(png|jpeg|webp|svg\+xml))$/.test(file.type);
  if (!allowed) { $('message').textContent = '请选择 PNG、JPG、WEBP 或 SVG 图片。'; return; }
  if (file.size > 30 * 1024 * 1024) { $('message').textContent = '图片超过 30 MB，请先缩小文件。'; return; }
  $('message').textContent = '正在读取图片…';
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (version !== loadVersion) return;
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 20000000 || Math.max(image.naturalWidth, image.naturalHeight) > 16384) {
      throw new Error('size');
    }
    // Read before replacing the current image, so an invalid file leaves it usable.
    const scratch = document.createElement('canvas');
    scratch.width = image.naturalWidth; scratch.height = image.naturalHeight;
    const context = scratch.getContext('2d');
    context.drawImage(image, 0, 0);
    context.getImageData(0, 0, 1, 1);
    original.width = scratch.width; original.height = scratch.height;
    original.getContext('2d').drawImage(scratch, 0, 0);
    rememberImage(file.name);
  } catch (error) {
    if (version === loadVersion) $('message').textContent = error.message === 'size' ? '图片尺寸过大，请使用 2000 万像素以内的图片。' : '无法读取这张图片，请尝试其他文件；SVG 需包含有效尺寸和内嵌图形。';
  } finally { URL.revokeObjectURL(url); }
}

$('upload').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', event => { loadFile(event.target.files[0]); event.target.value = ''; });
document.addEventListener('dragover', event => { event.preventDefault(); });
document.addEventListener('drop', event => { event.preventDefault(); $('upload').classList.remove('dragging'); loadFile(event.dataTransfer.files[0]); });
$('upload').addEventListener('dragenter', () => $('upload').classList.add('dragging'));
$('upload').addEventListener('dragleave', () => $('upload').classList.remove('dragging'));
document.addEventListener('paste', event => {
  const image = [...(event.clipboardData?.files || [])].find(file => file.type.startsWith('image/'));
  if (image) loadFile(image);
});

function demo(kind) {
  loadVersion++;
  original.width = original.height = 800;
  const context = original.getContext('2d');
  if (kind === 'logo') {
    const ribbon = new Path2D($('logo-ribbon').getAttribute('d'));
    context.fillStyle = '#000';
    for (let i = 0; i < 2; i++) {
      context.save();
      context.translate(400, 400);
      context.rotate(i * Math.PI);
      context.translate(-400, -400);
      context.fill(ribbon);
      context.restore();
    }
  } else {
    context.fillStyle = '#fff'; context.fillRect(0, 0, 800, 800);
    context.fillStyle = '#000';
    const size = QR_DEMO.length, unit = Math.floor(800 / (size + 8)), offset = Math.floor((800 - unit * size) / 2);
    QR_DEMO.forEach((row, y) => [...row].forEach((cell, x) => {
      if (cell === '1') context.fillRect(offset + x * unit, offset + y * unit, unit, unit);
    }));
  }
  rememberImage(kind === 'logo' ? '示例 Logo' : '示例二维码');
}
$('logo-demo').addEventListener('click', () => demo('logo'));
$('qr-demo').addEventListener('click', () => demo('qr'));
$('download').addEventListener('click', () => {
  $('download').disabled = true;
  result.toBlob(blob => {
    $('download').disabled = false;
    if (!blob) { $('message').textContent = '导出失败，请使用较小的图片重试。'; return; }
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url;
    link.download = `${filename.replace(/\.[^.]+$/, '')}-${state.foreground}-${state.background}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('message').textContent = 'PNG 已准备好，下载保留原始尺寸。';
  }, 'image/png');
});
demo('logo');

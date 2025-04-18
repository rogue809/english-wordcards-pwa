const fs = require('fs');

// 一个非常简单的SVG图标生成器
function generateIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="100%" height="100%" fill="#4A90E2"/>
    <text x="50%" y="50%" font-family="Arial" font-size="${size/6}" fill="white" text-anchor="middle" dominant-baseline="middle">E-Card</text>
  </svg>`;
}

// 创建两种尺寸的图标
fs.writeFileSync('icons/icon-192x192.svg', generateIcon(192));
fs.writeFileSync('icons/icon-512x512.svg', generateIcon(512));

console.log('SVG icons generated successfully!');

const fs = require('fs');
const path = require('path');

// Ensure static/images directory exists in build
const staticImagesDir = path.join(__dirname, '../build/static/images');
if (!fs.existsSync(staticImagesDir)) {
  fs.mkdirSync(staticImagesDir, { recursive: true });
}

// Copy images from public to build/static/images
const imagesToCopy = ['khpl.jpeg', 'KHPL-QR-CODE.jpeg'];

imagesToCopy.forEach(imageName => {
  const sourcePath = path.join(__dirname, '../public', imageName);
  const destPath = path.join(staticImagesDir, imageName);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${imageName} to static/images/`);
  } else {
    console.warn(`⚠️  Image not found: ${sourcePath}`);
  }
});

console.log('🎯 Image copy process completed!');
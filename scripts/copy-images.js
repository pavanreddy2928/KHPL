const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '../build');
const imagesToCopy = ['khpl.jpeg', 'KHPL-QR-CODE.jpeg'];

// Copy images to build root directory (for /image.jpg paths)
imagesToCopy.forEach(imageName => {
  const sourcePath = path.join(__dirname, '../public', imageName);
  const destPath = path.join(buildDir, imageName);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${imageName} to build root`);
  } else {
    console.warn(`⚠️  Image not found: ${sourcePath}`);
  }
});

// Also copy to static/images directory (as backup)
const staticImagesDir = path.join(buildDir, 'static/images');
if (!fs.existsSync(staticImagesDir)) {
  fs.mkdirSync(staticImagesDir, { recursive: true });
}

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
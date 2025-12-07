const fs = require('fs');
const path = require('path');

// Copy images from public to src/assets before build
const srcAssetsDir = path.join(__dirname, '../src/assets');
if (!fs.existsSync(srcAssetsDir)) {
  fs.mkdirSync(srcAssetsDir, { recursive: true });
}

// Copy images to src/assets so they get bundled by webpack
const imagesToCopy = ['khpl.jpeg', 'KHPL-QR-CODE.jpeg'];

imagesToCopy.forEach(imageName => {
  const sourcePath = path.join(__dirname, '../public', imageName);
  const destPath = path.join(srcAssetsDir, imageName);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${imageName} to src/assets/`);
  } else {
    console.warn(`⚠️  Image not found: ${sourcePath}`);
  }
});

console.log('🎯 Pre-build image copy completed!');
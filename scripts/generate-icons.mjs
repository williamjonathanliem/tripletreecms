// Run: node scripts/generate-icons.mjs
import sharp from 'sharp'

await sharp('public/logo.png').resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile('public/icon-192.png')
await sharp('public/logo.png').resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile('public/icon-512.png')

console.log('Icons generated from logo.png')

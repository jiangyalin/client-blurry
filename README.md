# client-blurry
浏览器端图片模糊库，支持马赛克、高斯模糊

```
import { gaussianBlurry, mosaic } from './index.js'

// 高斯模糊
gaussianBlurry(require('./test.png'), 5, 4.5, base64 => {
    console.log('base64', base64)
})


// 马赛克
mosaic(require('./test.png'), 5, base64 => {  
    console.log('base64', base64)  
})
```

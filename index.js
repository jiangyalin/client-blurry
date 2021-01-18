// 获取矩阵
const getArrMatrix = (arr, x, y, threshold) => {
  const matrix = []
  for (let i = 0; i < threshold; i++) {
    const row = []
    for (let j = 0; j < threshold; j++) {
      if (arr[y + i]) {
        if (arr[y + i][x + j]) {
          row.push(arr[y + i][x + j])
        } else {
          row.push(arr[y + (threshold - 1) / 2][x + (threshold - 1) / 2])
        }
      } else {
        row.push(arr[y + (threshold - 1) / 2][x + (threshold - 1) / 2])
      }
    }
    matrix.push(row)
  }
  return matrix
}

// 修改数组矩阵
const setArrMatrix = (arr, x, y, data) => {
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      arr[y + i][x + j] = data[i][j]
    }
  }
  return arr
}

// 判断颜色范围
const tsd = (color, min = 0, max = 255) => {
  if (min < 0) min = 0
  if (max > 255) max = 255
  return color <= max && color >= min
}

// 将hex颜色转成rgb
const hexToRgba = hex => {
  const RGBA = 'rgba(' + parseInt('0x' + hex.slice(1, 3)) + ',' + parseInt('0x' + hex.slice(3, 5)) + ',' + parseInt('0x' + hex.slice(5, 7)) + ',' + 1 + ')'
  return {
    red: parseInt('0x' + hex.slice(1, 3)),
    green: parseInt('0x' + hex.slice(3, 5)),
    blue: parseInt('0x' + hex.slice(5, 7)),
    rgba: RGBA
  }
}

const uint8ClampedArrayToArrMatrix = (imgData, width, height) => {
  const data = []
  for (let i = 0; i < height; i++) {
    const widthData = []
    for (let j = 0; j < width; j++) {
      widthData.push(['', '', '', ''])
    }
    data.push(widthData)
  }
  for (let i = 0; i < imgData.data.length / 4; i++) {
    data[Math.floor(i / width)][i % width][0] = imgData.data[i * 4]
    data[Math.floor(i / width)][i % width][1] = imgData.data[i * 4 + 1]
    data[Math.floor(i / width)][i % width][2] = imgData.data[i * 4 + 2]
    data[Math.floor(i / width)][i % width][3] = imgData.data[i * 4 + 3]
  }
  return data
}

// 获取权重矩阵
const getWeightsMatrix = (σ, radius) => {
  let data = []
  let total = 0
  for (let y = (0 - radius); y < (0 + radius + 1); y++) {
    const row = []
    for (let x = (0 - radius); x < (0 + radius + 1); x++) {
      const weights = 1 / (2 * Math.PI * Math.pow(σ, 2)) * Math.exp(-(Math.pow(x, 2) + Math.pow(y, 2)) / (2 * Math.pow(σ, 2)))
      row.push(weights)
      total += weights
    }
    data.push(row)
  }
  data = data.map(item => {
    return item.map(data => data / total)
  })
  return data
}

// 计算模糊rgba
const calculationRgba = (arrMatrix, weightsMatrix) => {
  let r = 0
  let g = 0
  let b = 0
  let a = 0
  weightsMatrix.forEach((item, i) => {
    item.forEach((data, j) => {
      r += arrMatrix[i][j][0] * data
      g += arrMatrix[i][j][1] * data
      b += arrMatrix[i][j][2] * data
      a += arrMatrix[i][j][3] * data
    })
  })
  return [r, g, b, a]
}

// 马赛克
const mosaic = (imgSrc, threshold, callback) => {
  init(imgSrc, (canvas, context, imgData, width, height) => {
    let data = uint8ClampedArrayToArrMatrix(imgData, width, height)
    for (let i = 0; i < Math.floor(height / threshold); i++) {
      for (let j = 0; j < Math.floor(width / threshold); j++) {
        let piece = getArrMatrix(data, j * threshold, i * threshold, threshold)
        const center = piece[(threshold - 1) / 2 + 1][(threshold - 1) / 2 + 1]
        piece = piece.map(item => {
          return item.map(() => center)
        })
        data = setArrMatrix(data, j * threshold, i * threshold, piece)
      }
    }
    data.forEach((item, i) => {
      item.forEach((data, j) => {
        imgData.data[i * width * 4 + j * 4] = data[0]
        imgData.data[i * width * 4 + j * 4 + 1] = data[1]
        imgData.data[i * width * 4 + j * 4 + 2] = data[2]
        imgData.data[i * width * 4 + j * 4 + 3] = data[3]
      })
    })
    context.putImageData(imgData, 0, 0)
    callback(canvas.toDataURL('png'))
    canvas.parentNode.removeChild(canvas)
  })
}

// 高斯模糊
const gaussianBlurry = (imgSrc, threshold, σ, callback) => {
  init(imgSrc, (canvas, context, imgData, width, height) => {
    const data = uint8ClampedArrayToArrMatrix(imgData, width, height)

    const weightsMatrix = getWeightsMatrix(σ, (threshold - 1) / 2)

    const _data = []
    data.forEach((item, y) => {
      const row = []
      item.forEach((list, x) => {
        const piece = getArrMatrix(data, x - (threshold - 1) / 2, y - (threshold - 1) / 2, threshold)
        row.push(calculationRgba(piece, weightsMatrix))
      })
      _data.push(row)
    })
    _data.forEach((item, i) => {
      item.forEach((data, j) => {
        imgData.data[i * width * 4 + j * 4] = data[0]
        imgData.data[i * width * 4 + j * 4 + 1] = data[1]
        imgData.data[i * width * 4 + j * 4 + 2] = data[2]
        imgData.data[i * width * 4 + j * 4 + 3] = data[3]
      })
    })
    context.putImageData(imgData, 0, 0)
    callback(canvas.toDataURL('png'))
    canvas.parentNode.removeChild(canvas)
  })
}

// 抠图
const cutout = (imgSrc, color, threshold, callback) => {
  init(imgSrc, (canvas, context, imgData, width, height) => {
    const data = uint8ClampedArrayToArrMatrix(imgData, width, height)

    data.forEach((item, i) => {
      item.forEach((data, j) => {
        const checkRed = tsd(data[0], hexToRgba(color).red - threshold, hexToRgba(color).red + threshold)
        const checkGreen = tsd(data[1], hexToRgba(color).green - threshold, hexToRgba(color).green + threshold)
        const checkBlue = tsd(data[2], hexToRgba(color).blue - threshold, hexToRgba(color).blue + threshold)
        const checkColor = checkRed && checkGreen && checkBlue
        if (checkColor) {
          imgData.data[i * width * 4 + j * 4] = 0
          imgData.data[i * width * 4 + j * 4 + 1] = 0
          imgData.data[i * width * 4 + j * 4 + 2] = 0
          imgData.data[i * width * 4 + j * 4 + 3] = 0
        }
      })
    })
    context.putImageData(imgData, 0, 0)
    callback(canvas.toDataURL('png'))
    canvas.parentNode.removeChild(canvas)
  })
}

const init = (data, callback) => {
  const canvas = document.createElement('canvas')
  canvas.className = 'j-client-blurry-canvas'
  document.querySelector('body').appendChild(canvas)
  canvas.style.display = 'none'
  const context = canvas.getContext('2d')
  const img = new Image()
  img.src = data
  img.onload = () => {
    const width = img.width
    const height = img.height
    canvas.width = width
    canvas.height = height
    context.drawImage(img, 0, 0, width, height)
    const imgData = context.getImageData(0, 0, width, height)
    callback(canvas, context, imgData, width, height)
  }
}

export {
  mosaic, // 马赛克
  gaussianBlurry, // 高斯模糊
  cutout // 抠图
}

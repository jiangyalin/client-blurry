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

// 去除黑条（去码）
const removeBlackBar = (imgSrc, callback = () => {}) => {
  init(imgSrc, (canvas, context, imgData, width, height) => {
    const blackBarArea = getBlackBarArea(uint8ClampedArrayToArrMatrix(imgData, width, height))

    const color = { r: 255, g: 101, b: 80, a: 255 }
    // const color = { r: 255, g: 255, b: 255, a: 255 }

    blackBarArea.forEach(item => {
      for (let x = item.x; x < item.x + item.w; x++) {
        for (let y = item.y; y < item.y + item.h; y++) {
          imgData.data[y * width * 4 + x * 4] = color.r
          imgData.data[y * width * 4 + x * 4 + 1] = color.g
          imgData.data[y * width * 4 + x * 4 + 2] = color.b
          imgData.data[y * width * 4 + x * 4 + 3] = color.a
        }
      }
    })

    context.putImageData(imgData, 0, 0)
    callback(canvas.toDataURL('png'))
    canvas.parentNode.removeChild(canvas)
  })
}

// 计算阵列中黑条的位置
const getBlackBarArea = matrix => {
  // const _matrix = matrix
  // 118, 229, 227

  // 获取检查点
  const getCheckPoint = (matrix, checkColor, x, y) => {
    // 检查中点
    const checkC = matrix[y][x].join() === checkColor
    // 检查上点
    const checkT = matrix[y - 1 >= 0 ? y - 1 : 0][x].join() === checkColor
    // 检查右点
    const checkR = matrix[y][x + 1 < matrix[0].length ? x + 1 : matrix[0].length - 1].join() === checkColor
    // 检查下点
    const checkB = matrix[y + 1 < matrix.length ? y + 1 : matrix.length - 1][x].join() === checkColor
    // 检查左点
    const checkL = matrix[y][x - 1 >= 0 ? x - 1 : 0].join() === checkColor

    return {
      checkC,
      checkT,
      checkR,
      checkB,
      checkL
    }
  }

  // 检查点类型
  const checkPointType = (matrix, checkColor, x, y) => {
    const checkPoint = getCheckPoint(matrix, checkColor, x, y)
    return {
      // 左上
      isTl: checkPoint.checkC && !checkPoint.checkT && checkPoint.checkR && checkPoint.checkB && !checkPoint.checkL,
      // 右上
      isTr: checkPoint.checkC && !checkPoint.checkT && !checkPoint.checkR && checkPoint.checkB && checkPoint.checkL,
      // 左下
      isBl: checkPoint.checkC && checkPoint.checkT && checkPoint.checkR && !checkPoint.checkB && !checkPoint.checkL,
      // 右下
      isBr: checkPoint.checkC && checkPoint.checkT && !checkPoint.checkR && !checkPoint.checkB && checkPoint.checkL,
      // 上中
      isTc: checkPoint.checkC && !checkPoint.checkT && checkPoint.checkR && checkPoint.checkB && checkPoint.checkL,
      // 下中
      isBc: checkPoint.checkC && checkPoint.checkT && checkPoint.checkR && !checkPoint.checkB && checkPoint.checkL,
      // 左中
      isLc: checkPoint.checkC && checkPoint.checkT && checkPoint.checkR && checkPoint.checkB && !checkPoint.checkL,
      // 右中
      isRc: checkPoint.checkC && checkPoint.checkT && !checkPoint.checkR && checkPoint.checkB && checkPoint.checkL
    }
  }

  // console.log('matrix', matrix)
  let tl = { x: 0, y: 0 } // 左上角
  let tr = { x: 0, y: 0 } // 右上角
  let bl = { x: 0, y: 0 } // 左下角
  let br = { x: 0, y: 0 } // 右下角
  let arr = []
  let check = false
  let testIndex = 0
  /*标记*/
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[0].length; x++) {
      const checkColor = matrix[y][x].join()
      check = false
      // 白色不进行矩形判断
      if (checkColor === '255,255,255,255') continue
      // 疑似tl
      if (checkPointType(matrix, checkColor, x, y).isTl) {
        tl = { x: x, y: y }
        for (let i = x; i < matrix[0].length; i++) {
          if (matrix[y][i].join() !== checkColor) {
            if (checkPointType(matrix, checkColor, i - 1, y).isTr && i - x > 10) {
              tr = { x: i - 1, y: y }
              testIndex ++
              check = true
            }
            break
          }
        }

        if (check) {
          check = false
          for (let i = tr.y; i < matrix.length; i++) {
            if (matrix[i][tr.x].join() !== checkColor) {
              if (checkPointType(matrix, checkColor, tr.x, i - 1).isBr && i - tr.y > 10) {
                br = { x: tr.x, y: i - 1 }
                check = true
              }
              break
            }
          }
        }

        if (check) {
          check = false
          for (let i = br.x; i >= 0; i--) {
            if (matrix[br.y][i].join() !== checkColor) {
              if (checkPointType(matrix, checkColor, i + 1, br.y).isBl && br.x - i > 10) {
                bl = { x: i + 1, y: br.y }
                check = true
              }
              break
            }
          }
        }
      }

      if (check) {
        arr.push({
          tl,
          tr,
          br,
          bl
        })
      }
    }
  }
  console.log('arr', arr)

  return arr.map(item => ({
    x: item.tl.x,
    y: item.tl.y,
    w: item.tr.x - item.tl.x + 1,
    h: item.bl.y - item.tl.y + 1
  }))
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
  cutout, // 抠图
  removeBlackBar // 去除黑条（去码）
}

/* eslint-disable */
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

// 超采样压缩
const oversampling = (imgSrc, threshold, callback) => {
	init(imgSrc, (canvas, context, imgData, width, height) => {
		let data = uint8ClampedArrayToArrMatrix(imgData, width, height)
		for (let i = 0; i < Math.floor(height / threshold); i++) {
			for (let j = 0; j < Math.floor(width / threshold); j++) {
				let piece = getArrMatrix(data, j * threshold, i * threshold, threshold)
				let average = [0, 0, 0, 0]
				piece.forEach(row => {
					row.forEach(item => {
						average[0] += Number(item[0])
						average[1] += Number(item[1])
						average[2] += Number(item[2])
						average[3] += Number(item[3])
					})
				})
				average = average.map(item => item / threshold / threshold)
				piece = piece.map(item => {
					return item.map(() => average)
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
			// for (let x = item.x; x < item.x + item.w; x++) {
			//   for (let y = item.y; y < item.y + item.h; y++) {
			//     imgData.data[y * width * 4 + x * 4] = color.r
			//     imgData.data[y * width * 4 + x * 4 + 1] = color.g
			//     imgData.data[y * width * 4 + x * 4 + 2] = color.b
			//     imgData.data[y * width * 4 + x * 4 + 3] = color.a
			//   }
			// }

			let w = 0
			for (let y = item.data.tl.y; y < item.data.br.y; y++) {
				let startX = 0
				let endX = 0
				if (item.data.bl.y === item.data.br.y) {
					startX = item.data.bl.x
					endX = item.data.br.x
				}
				if (item.data.bl.y !== item.data.br.y) {
					if (y <= item.data.bl.y) {
						startX = (item.data.tl.x + (item.data.bl.x - item.data.tl.x) / Math.abs(item.data.bl.y - item.data.tl.y) * (y - item.data.tl.y)).toFixed()
						endX = (item.data.tl.x + (item.data.tr.x - item.data.tl.x) / Math.abs(item.data.tr.y - item.data.tl.y) * (y - item.data.tl.y)).toFixed()
						if (y === item.data.bl.y) w = endX - startX
					}
					if (y > item.data.bl.y && y <= item.data.tr.y) {
						startX = (item.data.bl.x + (item.data.br.x - item.data.bl.x) / Math.abs(item.data.br.y - item.data.bl.y) * (y - item.data.bl.y)).toFixed()
						endX = Number(startX) + Number(w)
					}
					if (y > item.data.tr.y && y < item.data.br.y) {
						startX = (item.data.bl.x + (item.data.br.x - item.data.bl.x) / Math.abs(item.data.br.y - item.data.bl.y) * (y - item.data.bl.y)).toFixed()
						endX = (item.data.tr.x - (item.data.tr.x - item.data.br.x) / Math.abs(item.data.br.y - item.data.tr.y) * (y - item.data.tr.y))
					}
				}
				for (let x = startX; x < endX; x++) {
					imgData.data[y * width * 4 + x * 4] = color.r
					imgData.data[y * width * 4 + x * 4 + 1] = color.g
					imgData.data[y * width * 4 + x * 4 + 2] = color.b
					imgData.data[y * width * 4 + x * 4 + 3] = color.a
				}
				if (startX !== 0 || endX !== 0) {
					// console.log('y', y)
					// console.log('x', 'startX = ' + startX + '; endX = ' + endX)
				}
			}
			// const _y = 173
			// const _x = 418
			// imgData.data[_y * width * 4 + _x * 4] = color.r
			// imgData.data[_y * width * 4 + _x * 4 + 1] = color.g
			// imgData.data[_y * width * 4 + _x * 4 + 1] = color.b
			// imgData.data[_y * width * 4 + _x * 4 + 1] = color.a
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

		const getX = offset => {
			if (offset >= 0) return x + offset < matrix[0].length ? x + offset : matrix[0].length - 1
			if (offset < 0) return x + offset >= 0 ? x + offset : 0
		}
		const getY = offset => {
			if (offset >= 0) return y + offset < matrix.length ? y + offset : matrix.length - 1
			if (offset < 0) return y + offset >= 0 ? y + offset : 0
		}
		// 检查中点
		const checkC = matrix[y][x].join() === checkColor
		// 检查上点
		const checkT = matrix[getY(-1)][x].join() === checkColor
		// 检查右点
		const checkR = matrix[y][getX(1)].join() === checkColor
		// 检查下点
		const checkB = matrix[getY(1)][x].join() === checkColor
		// 检查左点
		const checkL = matrix[y][getX(-1)].join() === checkColor
		// 检查左上
		const checkTl = matrix[getY(-1)][getX(-1)].join() === checkColor
		// 检查右上
		const checkTr = matrix[getY(-1)][getX(1)].join() === checkColor
		// 检查左下
		const checkBl = matrix[getY(1)][getX(-1)].join() === checkColor
		// 检查右下
		const checkBr = matrix[getY(1)][getX(1)].join() === checkColor

		const arr = [checkT, checkTr, checkR, checkBr, checkB, checkBl, checkL, checkTl]

		let check = false

		if (arr.filter(item => item).length === 3) {
			arr.forEach((item, index) => {
				if (item) {
					let _check = true
					for (let i = 0; i < 3; i++) {
						if (!arr[index + i < arr.length ? index + i : index + i - arr.length]) _check = false
					}
					if (_check) check = true
				}
			})
		}

		return {
			checkC,
			checkT,
			checkR,
			checkB,
			checkL,
			checkTl,
			checkTr,
			checkBl,
			checkBr,
			isRightAngle: check
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
			isRc: checkPoint.checkC && checkPoint.checkT && !checkPoint.checkR && checkPoint.checkB && checkPoint.checkL,
			// 直角
			isRightAngle: checkPoint.isRightAngle
		}
	}

	let tl = { x: 0, y: 0 } // 左上角
	let tr = { x: 0, y: 0 } // 右上角
	let bl = { x: 0, y: 0 } // 左下角
	let br = { x: 0, y: 0 } // 右下角
	let arr = []
	let markPointArr = [] // 标识点(直角)数组
	let check = false
	// let testIndex = 0
	/*标记*/
	for (let y = 0; y < matrix.length; y++) {
		for (let x = 0; x < matrix[0].length; x++) {
			const checkColor = matrix[y][x].join()
			check = false
			// 白色不进行矩形判断
			if (checkColor === '255,255,255,255') continue
			if (y < 350) {
				// if (y > 140 && y < 210) {
				// if (x > 368 && y > 140 && y < 210) {
				if (checkPointType(matrix, checkColor, x, y).isRightAngle) {
					markPointArr.push({
						x,
						y,
						color: checkColor,
						_color: matrix[y][x]
					})
					arr.push({
						tl: { x, y },
						tr: { x: x + 4, y },
						br: { x: x + 4, y: y + 4 },
						bl: { x, y: y + 4 }
					})
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

	const junctionMap = {} // 连接点数组
	// 尝试连接所有标识点
	for (let i = 0; i < markPointArr.length; i++) {
		// 点1
		const tx1 = markPointArr[i].x
		const ty1 = markPointArr[i].y
		// const color = markPointArr[i].color
		const junction = []
		for (let j = 0; j < markPointArr.length; j++) {
			// 点2
			// 排除自身
			if (i === j) continue
			// 排除过于靠近的两个点
			if (Math.abs(markPointArr[i].x - markPointArr[j].x) < 10 && Math.abs(markPointArr[i].y - markPointArr[j].y) < 10) continue
			const tx2 = markPointArr[j].x
			const ty2 = markPointArr[j].y
			let xa = 0
			let ya = 0
			let start = tx1 > tx2 ? { x: tx2, y: ty2 } : { x: tx1, y: ty1 }
			if (tx1 > tx2) {
				xa = tx1 - tx2
				ya = ty1 - ty2
			} else {
				xa = tx2 - tx1
				ya = ty2 - ty1
			}
			let _color = {
				_r: 0,
				_g: 0,
				_b: 0
			}
			if (Math.abs(xa) > Math.abs(ya)) {
				for (let k = 0; k <= xa; k++) {
					const x = (start.x + k).toFixed()
					const y = (start.y + ya / xa * k).toFixed()
					_color._r = _color._r + matrix[y][x][0]
					_color._g = _color._g + matrix[y][x][1]
					_color._b = _color._b + matrix[y][x][2]
				}

				_color = {
					..._color,
					r: _color._r / xa,
					g: _color._g / xa,
					b: _color._b / xa,
					xa,
					ya,
					id: 'a'
				}
			} else {
				for (let k = 0; k <= ya; k++) {
					const x = (start.x + xa / ya * k).toFixed()
					const y = (start.y + k).toFixed()
					_color._r = _color._r + matrix[y][x][0]
					_color._g = _color._g + matrix[y][x][1]
					_color._b = _color._b + matrix[y][x][2]
				}

				_color = {
					..._color,
					r: _color._r / ya,
					g: _color._g / ya,
					b: _color._b / ya,
					xa,
					ya,
					id: 'b'
				}
			}
			const check = Math.abs(_color.r - markPointArr[i]._color[0]) < 20 && Math.abs(_color.g - markPointArr[i]._color[1]) < 20 && Math.abs(_color.b - markPointArr[i]._color[2]) < 20
			if (check) junction.push({ x: markPointArr[j].x, y: markPointArr[j].y })
			// if (!check) {
			//   console.log('kkk')
			//   console.log('_color', _color)
			//   console.log('markPointArr[i]', markPointArr[i])
			//   console.log('markPointArr[j]', markPointArr[j])
			// }
		}
		if (junction.length) {
			const key = JSON.stringify([{ x: markPointArr[i].x, y: markPointArr[i].y }, ...junction].sort((a, b) => (a.x + '0' + a.y) - (b.x + '0' + b.y)))
			junctionMap[key] = [{ x: markPointArr[i].x, y: markPointArr[i].y }, ...junction].sort((a, b) => (a.y + '0' + a.x) - (b.y + '0' + b.x))
		}
	}

	console.log('junctionMap', junctionMap)
	arr = []
	for (const key in junctionMap) {
		if (junctionMap[key].length !== 4) continue
		junctionMap[key] = junctionMap[key].sort((a, b) => a.y - b.y)
		const _junction = junctionMap[key].filter(item => item.y === junctionMap[key][0].y).sort((a, b) => a.x - b.x)
		const tl = _junction[0]
		const tr = junctionMap[key].find(item => (item.x !== tl.x || item.y !== tl.y) && item.x > tl.x)
		if (!tr) continue
		const bl = junctionMap[key].find(item => (item.x !== tl.x || item.y !== tl.y) && item.y > tl.y && item.x <= tl.x)
		if (!bl) continue
		// console.log('tl', tl)
		// console.log('tr', tr)
		// console.log('bl', bl)
		// console.log('junctionMap[key]', junctionMap[key])
		const br = junctionMap[key].find(item => (item.x !== tl.x || item.y !== tl.y) && (item.x !== tr.x || item.y !== tr.y) && (item.x !== bl.x || item.y !== bl.y))
		if (!br) continue
		arr.push({
			tl,
			tr,
			br,
			bl,
			r: Math.abs(tl.y - tr.y) * Math.abs(tl.y - tr.y) / (Math.abs(tl.y - tr.y) * Math.abs(tl.y - tr.y) + Math.abs(tl.x - tr.x) * Math.abs(tl.x - tr.x)) * 90
		})
	}

	console.log('markPointArr', markPointArr)
	console.log('arr', arr)

	// console.log('arr', arr)

	// console.log('matrix', matrix[145][379].join()) // cc
	// const ccx = 380
	// const ccy = 146
	// const expand = 4
	// const table = []
	// for (let i = ccy - expand; i <= ccy + expand; i++) {
	//   const row = []
	//   for (let j = ccx - expand; j <= ccx + expand; j++) {
	//     row.push(matrix[i][j].slice(0, 3).join())
	//   }
	//   table.push(row)
	// }
	// window.table = table

	// 标记
	// 计算正确的旋转结果

	return [...arr.map(item => {
		const a = Math.abs(item.tr.x - item.tl.x) + 1
		const b = Math.abs(item.tr.y - item.tl.y) + 1

		const aa = Math.abs(item.bl.x - item.tl.x) + 1
		const bb = Math.abs(item.bl.y - item.tl.y) + 1
		return {
			x: item.tl.x,
			y: item.tl.y,
			w: Math.sqrt(a * a + b * b),
			h: Math.sqrt(aa * aa + bb * bb),
			r: item.r,
			data: item
		}
	})]
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
	oversampling, // 超采样压缩
	cutout, // 抠图
	removeBlackBar // 去除黑条（去码）
}

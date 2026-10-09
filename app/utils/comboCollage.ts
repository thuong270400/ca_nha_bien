/**
 * Ghép ảnh các sản phẩm trong combo thành 1 ảnh vuông, mỗi ô có nhãn 2 dòng
 * "Tên x số lượng" / "Đơn vị: ..." ở góc dưới — vẽ bằng canvas ngay trên trình duyệt
 * admin (font hệ thống hiển thị đúng tiếng Việt, server không cần cài font/thư
 * viện ảnh), rồi upload như ảnh thường vào folder COMBO_COLLAGE_FOLDER.
 */

export const COMBO_COLLAGE_FOLDER = 'combo-collages'

export function isComboCollageUrl(url: string) {
  return url.startsWith(`/uploads/${COMBO_COLLAGE_FOLDER}/`)
}

export interface CollageTile {
  imageUrl: string | null
  productName: string
  unit: string
  quantity: number
}

const SIZE = 1600
const GAP = 10
const PLACEHOLDER = '/images/placeholder-fish.svg'
const FONT_FAMILY = 'ui-sans-serif, system-ui, "Segoe UI", Roboto, Arial, sans-serif'

/** Nhãn 2 dòng: ["Cá Ngừ x 2", "Đơn vị: kg"]. */
export function collageLabel(tile: Pick<CollageTile, 'productName' | 'unit' | 'quantity'>): string[] {
  return [`${tile.productName} x ${tile.quantity}`, `Đơn vị: ${tile.unit.trim()}`]
}

/** Số ô mỗi hàng, hàng trên ít ô hơn: 4 -> [2,2], 5 -> [2,3], 7 -> [3,4]. */
function rowLayout(count: number): number[] {
  const rows = count <= 3 ? 1 : count <= 8 ? 2 : Math.ceil(count / 4)
  const base = Math.floor(count / rows)
  const extra = count % rows
  return Array.from({ length: rows }, (_, i) => base + (i >= rows - extra ? 1 : 0))
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Không tải được ảnh ${url}`))
    img.src = url
  })
}

async function loadTileImage(url: string | null) {
  try {
    return await loadImage(url ?? PLACEHOLDER)
  } catch {
    return await loadImage(PLACEHOLDER)
  }
}

/** Vẽ ảnh phủ kín ô (cắt phần thừa, giữ tâm) — như CSS object-cover. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const iw = img.naturalWidth || w
  const ih = img.naturalHeight || h
  const scale = Math.max(w / iw, h / ih)
  const sw = w / scale
  const sh = h / scale
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h)
}

function drawLabel(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, w: number, h: number) {
  const margin = Math.round(Math.min(w, h) * 0.04)
  const maxWidth = w - margin * 2
  let fontSize = Math.round(Math.min(Math.max(Math.min(w, h) * 0.075, 20), 50))
  // Dòng đầu (tên x số lượng) đậm và to hơn dòng đơn vị.
  const fonts = () => [`bold ${fontSize}px ${FONT_FAMILY}`, `600 ${Math.round(fontSize * 0.8)}px ${FONT_FAMILY}`]
  const padX = () => Math.round(fontSize * 0.45)
  const widestLine = () => Math.max(...lines.map((line, i) => {
    ctx.font = fonts()[Math.min(i, 1)]!
    return ctx.measureText(line).width
  }))
  while (fontSize > 14 && widestLine() + padX() * 2 > maxWidth) fontSize -= 2

  const lineHeights = lines.map((_, i) => Math.round((i === 0 ? fontSize : fontSize * 0.8) * 1.3))
  const padY = Math.round(fontSize * 0.3)
  const boxW = Math.min(widestLine() + padX() * 2, maxWidth)
  const boxH = lineHeights.reduce((sum, lh) => sum + lh, 0) + padY * 2
  const boxX = x + margin
  const boxY = y + h - margin - boxH

  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, Math.round(fontSize * 0.3))
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'middle'
  let lineY = boxY + padY
  lines.forEach((line, i) => {
    ctx.font = fonts()[Math.min(i, 1)]!
    ctx.fillText(line, boxX + padX(), lineY + lineHeights[i]! / 2, boxW - padX() * 2)
    lineY += lineHeights[i]!
  })
}

export async function buildComboCollage(tiles: CollageTile[]): Promise<Blob> {
  if (!tiles.length) throw new Error('Combo chưa có sản phẩm nào để ghép ảnh')
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ ghép ảnh')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, SIZE, SIZE)

  const images = await Promise.all(tiles.map(t => loadTileImage(t.imageUrl)))
  const rows = rowLayout(tiles.length)
  const rowH = (SIZE - GAP * (rows.length + 1)) / rows.length

  let index = 0
  rows.forEach((cols, r) => {
    const cellW = (SIZE - GAP * (cols + 1)) / cols
    const y = GAP + r * (rowH + GAP)
    for (let c = 0; c < cols; c++) {
      const x = GAP + c * (cellW + GAP)
      drawCover(ctx, images[index]!, x, y, cellW, rowH)
      drawLabel(ctx, collageLabel(tiles[index]!), x, y, cellW, rowH)
      index++
    }
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Không xuất được ảnh ghép'))), 'image/jpeg', 0.88)
  })
}

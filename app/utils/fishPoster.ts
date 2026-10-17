/**
 * Ảnh cá "bản quyền" cho mạng xã hội: ảnh sản phẩm phủ kín khung 4:5, thẻ tên cá
 * + giá/đơn vị ở góc trên trái, chữ thương hiệu mờ giữa ảnh, dải sóng trắng phía
 * dưới ghi gợi ý nấu. Vẽ bằng canvas ngay trên trình duyệt admin (giống
 * comboCollage.ts) — font trình duyệt hiển thị đúng tiếng Việt, server không cần
 * thư viện ảnh.
 */

export const DEFAULT_POSTER_BRAND = 'canhabien.vn'

export interface FishPosterInput {
  imageUrl: string | null
  name: string
  /** Ví dụ "250.000 ₫/kg" — bỏ trống thì không vẽ thẻ giá. */
  priceLabel: string
  cookingTips: string
  brand: string
}

const WIDTH = 1080
const HEIGHT = 1350
const PLACEHOLDER = '/images/placeholder-fish.svg'
const FONT_FAMILY = '"Inter", ui-sans-serif, system-ui, "Segoe UI", Roboto, Arial, sans-serif'
const BRAND_BLUE = '#0b4ea2'
const LOGO = '/images/logo/logo.png'

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Không tải được ảnh ${url}`))
    img.src = url
  })
}

async function loadPosterImage(url: string | null) {
  try {
    return await loadImage(url ?? PLACEHOLDER)
  } catch {
    return await loadImage(PLACEHOLDER)
  }
}

/** Đợi webfont (Inter) tải xong, không thì canvas vẽ bằng font dự phòng. */
async function ensureFonts() {
  if (typeof document === 'undefined' || !document.fonts) return
  await Promise.all([
    document.fonts.load(`bold 72px ${FONT_FAMILY}`, 'Cá'),
    document.fonts.load(`600 48px ${FONT_FAMILY}`, 'Cá'),
    document.fonts.load(`500 48px ${FONT_FAMILY}`, 'Cá'),
  ]).catch(() => {})
}

/** Vẽ ảnh phủ kín vùng (cắt phần thừa, giữ tâm) — như CSS object-cover. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const iw = img.naturalWidth || w
  const ih = img.naturalHeight || h
  const scale = Math.max(w / iw, h / ih)
  const sw = w / scale
  const sh = h / scale
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h)
}

/** Giảm cỡ chữ tới khi vừa `maxWidth`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: string, size: number, min: number, maxWidth: number) {
  let fontSize = size
  ctx.font = `${weight} ${fontSize}px ${FONT_FAMILY}`
  while (fontSize > min && ctx.measureText(text).width > maxWidth) {
    fontSize -= 2
    ctx.font = `${weight} ${fontSize}px ${FONT_FAMILY}`
  }
  return fontSize
}

/** Tách chữ thành tối đa `maxLines` dòng vừa `maxWidth` (font đã set sẵn trên ctx). */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (current && ctx.measureText(next).width > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.length > maxLines ? null : lines
}

/** Thẻ tên cá: nền xanh, sát mép trái, bo góc phải. Trả về đáy thẻ để xếp thẻ giá bên dưới. */
function drawNameTag(ctx: CanvasRenderingContext2D, name: string) {
  const top = 44
  const padX = 40
  const fontSize = fitFont(ctx, name, 'bold', 64, 32, WIDTH * 0.72 - padX * 2)
  const textWidth = ctx.measureText(name).width
  const h = Math.round(fontSize * 1.9)
  const w = textWidth + padX * 2

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
  ctx.shadowBlur = 16
  ctx.fillStyle = BRAND_BLUE
  ctx.beginPath()
  ctx.roundRect(0, top, w, h, [0, h / 2, h / 2, 0])
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(name, padX, top + h / 2)
  return top + h
}

function drawPriceTag(ctx: CanvasRenderingContext2D, price: string, top: number) {
  const padX = 32
  const fontSize = fitFont(ctx, price, 'bold', 46, 24, WIDTH * 0.6 - padX * 2)
  const w = ctx.measureText(price).width + padX * 2
  const h = Math.round(fontSize * 1.8)

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
  ctx.shadowBlur = 12
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(0, top, w, h, [0, h / 2, h / 2, 0])
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#d92d20'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(price, padX, top + h / 2)
}

/** Logo hơi mờ ở góc phải dưới (giữ tỉ lệ gốc, cạnh dài ~140px). */
function drawLogo(ctx: CanvasRenderingContext2D, logo: HTMLImageElement) {
  const max = 140
  const margin = 32
  const iw = logo.naturalWidth || max
  const ih = logo.naturalHeight || max
  const scale = max / Math.max(iw, ih)
  const w = iw * scale
  const h = ih * scale
  ctx.save()
  ctx.globalAlpha = 0.6
  ctx.drawImage(logo, WIDTH - margin - w, HEIGHT - margin - h, w, h)
  ctx.restore()
}

/** Chữ thương hiệu trắng xám mờ, to giữa ảnh — khó cắt bỏ khi bị lấy ảnh. */
function drawWatermark(ctx: CanvasRenderingContext2D, brand: string) {
  fitFont(ctx, brand, '600', 110, 40, WIDTH * 0.78)
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(80, 80, 80, 0.18)'
  ctx.fillStyle = 'rgba(235, 235, 235, 0.42)'
  ctx.strokeText(brand, WIDTH / 2, HEIGHT * 0.5)
  ctx.fillText(brand, WIDTH / 2, HEIGHT * 0.5)
  ctx.restore()
}

function wavePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, amp: number, period: number) {
  for (let i = 0; i <= w; i += 4) {
    ctx.lineTo(x + i, y + Math.sin((i / period) * Math.PI * 2) * amp)
  }
}

/** Dải trắng mép sóng phía dưới + chữ gợi ý nấu màu xanh. */
function drawTipsBand(ctx: CanvasRenderingContext2D, tips: string) {
  // Chừa cột bên phải cho logo (32 lề + 140 logo) — đối xứng để chữ vẫn căn giữa.
  const padX = 190
  const maxWidth = WIDTH - padX * 2
  let fontSize = 62
  let lines: string[] | null = null
  while (fontSize >= 30) {
    ctx.font = `500 ${fontSize}px ${FONT_FAMILY}`
    lines = wrapText(ctx, tips, maxWidth, 2)
    if (lines) break
    fontSize -= 2
  }
  if (!lines) {
    // Quá dài cho 2 dòng ở cỡ nhỏ nhất: gộp 1 dòng, fillText tự nén chiều ngang.
    lines = wrapText(ctx, tips, Number.POSITIVE_INFINITY, 1) ?? [tips]
  }

  const lineHeight = Math.round(fontSize * 1.3)
  const bandTop = HEIGHT - (lines.length * lineHeight + 150)

  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(0, HEIGHT)
  ctx.lineTo(0, bandTop)
  wavePath(ctx, 0, bandTop, WIDTH, 14, 180)
  ctx.lineTo(WIDTH, HEIGHT)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = BRAND_BLUE
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const textTop = bandTop + 40
  lines.forEach((line, i) => {
    ctx.fillText(line, WIDTH / 2, textTop + lineHeight * (i + 0.5), maxWidth)
  })
}

export async function buildFishPoster(input: FishPosterInput): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ tạo ảnh')

  const [img, logo] = await Promise.all([
    loadPosterImage(input.imageUrl),
    loadImage(LOGO).catch(() => null),
    ensureFonts(),
  ])

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  drawCover(ctx, img, 0, 0, WIDTH, HEIGHT)

  drawWatermark(ctx, input.brand.trim() || DEFAULT_POSTER_BRAND)
  const name = input.name.trim()
  const tagBottom = name ? drawNameTag(ctx, name) : 44
  if (input.priceLabel.trim()) drawPriceTag(ctx, input.priceLabel.trim(), tagBottom + 16)
  if (input.cookingTips.trim()) drawTipsBand(ctx, input.cookingTips.trim())
  if (logo) drawLogo(ctx, logo)

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Không xuất được ảnh'))), 'image/jpeg', 0.92)
  })
}

export class AppError extends Error {
  statusCode: number
  data?: unknown

  constructor(statusCode: number, message: string, data?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.data = data
  }
}

export const Errors = {
  badRequest: (message = 'Yêu cầu không hợp lệ', data?: unknown) => new AppError(400, message, data),
  unauthorized: (message = 'Vui lòng đăng nhập để tiếp tục') => new AppError(401, message),
  forbidden: (message = 'Bạn không có quyền thực hiện thao tác này') => new AppError(403, message),
  notFound: (message = 'Không tìm thấy dữ liệu') => new AppError(404, message),
  conflict: (message = 'Dữ liệu đã tồn tại') => new AppError(409, message),
  tooManyRequests: (message = 'Bạn thao tác quá nhanh, vui lòng thử lại sau') => new AppError(429, message),
}

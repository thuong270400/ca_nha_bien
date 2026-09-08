import type { H3Event } from 'h3'
import { ZodError } from 'zod'
import { Prisma } from '../generated/prisma/client'
import { AppError } from './errors'

/**
 * Wraps a server event handler so every thrown error (AppError, ZodError,
 * known Prisma errors, or an existing h3 error) is converted into a single
 * consistent h3 error shape instead of leaking raw stack traces to clients.
 */
export function defineApiHandler<T>(handler: (event: H3Event) => Promise<T>) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event)
    } catch (err) {
      throw toH3Error(err)
    }
  })
}

function toH3Error(err: unknown) {
  if (err instanceof AppError) {
    return createError({ statusCode: err.statusCode, message: err.message, data: err.data })
  }

  if (err instanceof ZodError) {
    return createError({
      statusCode: 400,
      message: 'Dữ liệu không hợp lệ',
      data: { issues: err.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })) },
    })
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return createError({ statusCode: 409, message: 'Dữ liệu đã tồn tại' })
    }
    if (err.code === 'P2025') {
      return createError({ statusCode: 404, message: 'Không tìm thấy dữ liệu' })
    }
    if (err.code === 'P2003') {
      return createError({ statusCode: 409, message: 'Không thể thực hiện vì dữ liệu đang được sử dụng ở nơi khác' })
    }
  }

  // Already an h3 error (e.g. thrown by requireUserSession, createError elsewhere)
  if (err && typeof err === 'object' && 'statusCode' in err) {
    return err
  }

  console.error(err)
  return createError({ statusCode: 500, message: 'Đã có lỗi xảy ra, vui lòng thử lại sau' })
}

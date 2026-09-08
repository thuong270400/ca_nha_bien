export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
  if (user.value?.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Bạn không có quyền truy cập trang quản trị', fatal: true })
  }
})

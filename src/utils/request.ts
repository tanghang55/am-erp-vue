import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
// 开发环境使用 vite 代理，生产环境使用环境变量配置的后端地址
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 从localStorage获取token（如果有）
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const operatorId = getOperatorId()
    if (operatorId && config.method) {
      const method = config.method.toLowerCase()
      if (['post', 'put', 'patch', 'delete'].includes(method)) {
        if (config.data instanceof FormData) {
          if (!config.data.has('operator_id')) {
            config.data.append('operator_id', String(operatorId))
          }
        } else if (typeof config.data === 'object' && config.data !== null) {
          if (!('operator_id' in config.data)) {
            config.data.operator_id = operatorId
          }
        } else if (config.data === undefined) {
          config.data = { operator_id: operatorId }
        }
      }
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // 后端返回格式: { code: number, data: any, message: string }
    // code: 0 表示成功，非0表示失败
    const success = res.code === 0

    if (!success) {
      ElMessage.error(res.message || 'Request failed')
      return Promise.reject(new Error(res.message || 'Request failed'))
    }

    // 转换为统一的前端格式: { success: boolean, data: any, message: string }
    return {
      success: true,
      data: res.data,
      message: res.message
    }
  },
  (error) => {
    console.error('Response error:', error)

    let message = 'Unknown error'
    if (error.response) {
      // 优先使用后端返回的错误信息
      const responseMessage = error.response.data?.message || error.response.data?.error

      switch (error.response.status) {
        case 401:
          message = responseMessage || 'Unauthorized, please login'
          // 可以在这里跳转到登录页
          break
        case 403:
          message = responseMessage || 'Access denied'
          break
        case 404:
          message = responseMessage || 'Resource not found'
          break
        case 500:
          message = responseMessage || 'Server error'
          break
        default:
          message = responseMessage || error.message
      }
    } else if (error.request) {
      message = 'Network error, please check your connection'
    }

    ElMessage.error(message)
    // 标记错误已处理，组件中不需要再显示
    error._handled = true
    error._message = message
    return Promise.reject(error)
  }
)

export default service

const getOperatorId = () => {
  try {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) return null
    const parsed = JSON.parse(savedUser)
    return parsed?.id ?? null
  } catch (error) {
    return null
  }
}

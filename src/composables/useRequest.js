import axios from 'axios'
import { ref } from 'vue'

const toastMessage = ref('')
const toastType = ref('info')

export function useRequest() {
  const instance = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
  })

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('userToken')
    if (token) {
      try {
        config.headers.Authorization = `Bearer ${JSON.parse(token)}`
      } catch {
        localStorage.removeItem('userToken')
      }
    }
    return config
  })

  instance.interceptors.response.use(
    (response) => {
      const res = response.data
      if (res.success === true) {
        return res.data
      }

      toastMessage.value = res.message || '请求失败'
      toastType.value = 'danger'
      return Promise.reject(new Error(res.message || '请求失败'))
    },
    (error) => {
      const msg = error.response?.data?.message || '网络连接失败'
      toastMessage.value = msg
      toastType.value = 'danger'
      if (error.response?.status === 401) {
        localStorage.removeItem('userToken')
        localStorage.removeItem('userInfo')
        setTimeout(() => { window.location.href = '/login' }, 1200)
      }
      return Promise.reject(error)
    }
  )

  return {
    get: (url, params) => instance.get(url, { params }),
    post: (url, data, config) => instance.post(url, data, config),
    put: (url, data) => instance.put(url, data),
    del: (url) => instance.delete(url),
    toastMessage,
    toastType
  }
}

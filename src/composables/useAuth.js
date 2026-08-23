import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRequest } from './useRequest'
import { useStorage } from './useStorage'

const user = ref(null)
const token = ref(null)
const { get, set, remove } = useStorage()

function normalizeUser(data) {
  if (!data) return data
  return {
    ...data,
    realName: data.realName ?? data.real_name,
    studentId: data.studentId ?? data.student_id,
    accountType: data.accountType ?? data.account_type,
    avatarUrl: data.avatarUrl ?? data.avatar_url,
    createdAt: data.createdAt ?? data.created_at
  }
}

export function useAuth() {
  const router = useRouter()
  const { post, get: httpGet } = useRequest()
  const isLoggedIn = computed(() => !!token.value)

  function loadFromStorage() {
    token.value = get('userToken')
    user.value = get('userInfo')
  }

  async function login(credentials) {
    const data = await post('/auth/login', credentials)
    token.value = data.token
    user.value = normalizeUser(data.user)
    set('userToken', data.token)
    set('userInfo', user.value)
    return data
  }

  async function register(formData) {
    return await post('/auth/register', formData)
  }

  async function fetchProfile() {
    const data = await httpGet('/user/profile')
    user.value = normalizeUser(data)
    set('userInfo', user.value)
  }

  function logout() {
    token.value = null
    user.value = null
    remove('userToken')
    remove('userInfo')
    router.push('/login')
  }

  function hasRole(role) {
    return user.value?.accountType === role
  }

  // Initialize
  loadFromStorage()

  return { user, token, isLoggedIn, login, register, fetchProfile, logout, hasRole }
}

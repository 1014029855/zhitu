import { createRouter, createWebHistory } from 'vue-router'
import { useStorage } from '../composables/useStorage'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/HomePage.vue'), meta: { requiresAuth: true } },
  { path: '/login', name: 'Login', component: () => import('../views/LoginPage.vue'), meta: { guestOnly: true, hideShell: true } },
  { path: '/register', name: 'Register', component: () => import('../views/RegisterPage.vue'), meta: { guestOnly: true, hideShell: true } },
  { path: '/forgot-password', name: 'ForgotPassword', component: () => import('../views/ForgotPasswordPage.vue'), meta: { guestOnly: true, hideShell: true } },
  { path: '/competition', name: 'Competition', component: () => import('../views/CompetitionPage.vue'), meta: { requiresAuth: true } },
  { path: '/competition/:id', name: 'CompetitionDetail', component: () => import('../views/CompetitionDetail.vue'), meta: { requiresAuth: true } },
  { path: '/skills', name: 'Skills', component: () => import('../views/SkillsPage.vue'), meta: { requiresAuth: true, hideShell: true } },
  { path: '/skills/:id', name: 'SkillDetail', component: () => import('../views/SkillDetail.vue'), meta: { requiresAuth: true, hideShell: true } },
  { path: '/skills/:courseId/lessons/:lessonId', name: 'LessonPlayer', component: () => import('../views/LessonPlayer.vue'), meta: { requiresAuth: true, hideShell: true } },
  { path: '/ai', name: 'AiChat', component: () => import('../views/AiChatPage.vue'), meta: { requiresAuth: true } },
  { path: '/papers', name: 'Papers', component: () => import('../views/PapersPage.vue'), meta: { requiresAuth: true } },
  { path: '/papers/:id', name: 'PaperDetail', component: () => import('../views/PaperDetail.vue'), meta: { requiresAuth: true } },
  { path: '/exercises', name: 'CodeExercise', component: () => import('../views/CodeExercise.vue'), meta: { requiresAuth: true } },
  { path: '/exercises/:id', name: 'CodeExerciseDetail', component: () => import('../views/CodeExerciseDetail.vue'), meta: { requiresAuth: true } },
  { path: '/leaderboard', name: 'Leaderboard', component: () => import('../views/Leaderboard.vue'), meta: { requiresAuth: true } },
  { path: '/admin/exercises', name: 'AdminExercises', component: () => import('../views/AdminExercises.vue'), meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/admin/courses', name: 'AdminCourses', component: () => import('../views/AdminCourses.vue'), meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/admin/courses/:id', name: 'CourseStudio', component: () => import('../views/CourseStudio.vue'), meta: { requiresAuth: true, roles: ['admin'], hideShell: true } },
  { path: '/user', name: 'UserCenter', component: () => import('../views/UserCenter.vue'), meta: { requiresAuth: true } },
  { path: '/teacher', name: 'Teacher', component: () => import('../views/TeacherPage.vue'), meta: { requiresAuth: true, roles: ['teacher', 'admin'] } },
  { path: '/admin', name: 'Admin', component: () => import('../views/AdminPage.vue'), meta: { requiresAuth: true, roles: ['admin'] } }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const { get } = useStorage()
  const token = get('userToken')
  const user = get('userInfo')

  if (to.meta.guestOnly && token && user) {
    return next('/')
  }

  if (to.meta.requiresAuth) {
    if (!token || !user) {
      return next('/login')
    }

    if (to.meta.roles && !to.meta.roles.includes(user.accountType)) {
      return next('/')
    }
  }
  next()
})

export default router

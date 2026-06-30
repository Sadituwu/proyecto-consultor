<script setup>
import api from '@/services/axios'
import { useRouter, useRoute } from 'vue-router'
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

onMounted(async () => {
  const token = route.query.token

  if (!token) {
    ElMessage.error('No se recibió el token de Google.')
    router.replace({ name: 'Login' })
    return
  }

  // Flujo Google OAuth:
  // 1. El backend valida con Google y genera un token Sanctum (JWT)
  // 2. Redirige aquí con ?token= en la URL
  // 3. Se guarda el access_token en localStorage
  // 4. Se consulta /api/usuario para obtener los datos del usuario autenticado
  // 5. Con el token y el usuario listos, se redirige al dashboard interno (/modelo)
  localStorage.setItem('access_token', token)

  try {
    const res = await api.get('/usuario')
    localStorage.setItem('user', JSON.stringify(res.data))
    router.replace({ name: 'Dashboard' }) // → dashboard interno
  } catch (error) {
    console.error(error)
    localStorage.removeItem('access_token')
    ElMessage.error('No se pudo iniciar sesión con Google.')
    router.replace({ name: 'Login' })
  }
})
</script>

<template>
  <div class="callback-wrap">
    <el-icon class="is-loading" :size="32">
      <Loading />
    </el-icon>
    <p>Iniciando sesión...</p>
  </div>
</template>

<style scoped>
.callback-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 100vh;
}
</style>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/axios'
import { ElMessage } from 'element-plus'
import { UserFilled, Medal } from '@element-plus/icons-vue'

const router  = useRouter()
const loading = ref(false)

async function elegirRol(rol) {
  loading.value = true
  try {
    const { data } = await api.put('/usuario/rol', { rol })
    localStorage.setItem('user', JSON.stringify(data))
    ElMessage.success(rol === 2 ? '¡Bienvenido, Mentor!' : '¡Bienvenido, Aprendiz!')
    router.replace({ name: 'Dashboard' })
  } catch (e) {
    ElMessage.error('No se pudo guardar el rol. Intenta de nuevo.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="rol-wrap">
    <div class="rol-box">

      <!-- Cabecera -->
      <div class="rol-header">
        <h1 class="rol-titulo">¿Cómo quieres usar la plataforma?</h1>
        <p class="rol-sub">Elige tu rol para personalizar tu experiencia. Esto puede cambiar más adelante.</p>
      </div>

      <!-- Cards de rol -->
      <div class="rol-cards">

        <!-- Aprendiz -->
        <button
          class="rol-card"
          :disabled="loading"
          @click="elegirRol(1)"
        >
          <div class="rol-card__icon rol-card__icon--aprendiz">
            <el-icon :size="40"><UserFilled /></el-icon>
          </div>
          <h2 class="rol-card__titulo">Aprendiz</h2>
          <p class="rol-card__desc">
            Busca mentores, agenda sesiones y recibe orientación académica y profesional.
          </p>
          <ul class="rol-card__lista">
            <li>Buscar mentores por especialidad</li>
            <li>Agendar sesiones de mentoría</li>
            <li>Calificar y comentar sesiones</li>
          </ul>
          <div class="rol-card__badge rol-card__badge--aprendiz">Estudiante de ciclos iniciales</div>
        </button>

        <!-- Mentor -->
        <button
          class="rol-card rol-card--mentor"
          :disabled="loading"
          @click="elegirRol(2)"
        >
          <div class="rol-card__icon rol-card__icon--mentor">
            <el-icon :size="40"><Medal /></el-icon>
          </div>
          <h2 class="rol-card__titulo">Mentor</h2>
          <p class="rol-card__desc">
            Comparte tu experiencia, acepta solicitudes y guía a estudiantes en su camino académico.
          </p>
          <ul class="rol-card__lista">
            <li>Recibir solicitudes de sesión</li>
            <li>Gestionar tu disponibilidad</li>
            <li>Construir tu reputación con valoraciones</li>
          </ul>
          <div class="rol-card__badge rol-card__badge--mentor">Estudiante de ciclos avanzados</div>
        </button>

      </div>

      <p class="rol-nota">
        Podrás actualizar tu rol en cualquier momento desde tu perfil.
      </p>

    </div>
  </div>
</template>

<style scoped>
.rol-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-lighter);
  padding: 2rem 1rem;
}

.rol-box {
  width: 100%;
  max-width: 780px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.rol-header {
  text-align: center;
}

.rol-titulo {
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 800;
  color: var(--el-text-color-primary);
  margin: 0 0 0.5rem;
}

.rol-sub {
  color: var(--el-text-color-secondary);
  font-size: 0.95rem;
  margin: 0;
}

/* ── Cards ───────────────────────────────────────────────────────────── */
.rol-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  width: 100%;
}

@media (max-width: 620px) {
  .rol-cards { grid-template-columns: 1fr; }
}

.rol-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1.5rem;
  border: 2px solid var(--el-border-color-lighter);
  border-radius: 20px;
  background: var(--el-bg-color);
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
}

.rol-card:hover:not(:disabled) {
  border-color: var(--el-color-primary);
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(64, 158, 255, 0.15);
}

.rol-card--mentor:hover:not(:disabled) {
  border-color: #9b59b6;
  box-shadow: 0 12px 32px rgba(155, 89, 182, 0.15);
}

.rol-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Ícono ───────────────────────────────────────────────────────────── */
.rol-card__icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rol-card__icon--aprendiz {
  background: #ecf5ff;
  color: #409eff;
}

.rol-card__icon--mentor {
  background: #f5eeff;
  color: #9b59b6;
}

/* ── Texto ───────────────────────────────────────────────────────────── */
.rol-card__titulo {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--el-text-color-primary);
  margin: 0;
}

.rol-card__desc {
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
  margin: 0;
  line-height: 1.5;
}

.rol-card__lista {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}

.rol-card__lista li {
  font-size: 0.8rem;
  color: var(--el-text-color-regular);
  padding: 0.35rem 0.75rem;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.rol-card__lista li::before {
  content: '✓  ';
  color: var(--el-color-success);
  font-weight: 700;
}

/* ── Badge ───────────────────────────────────────────────────────────── */
.rol-card__badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  margin-top: 0.25rem;
}

.rol-card__badge--aprendiz {
  background: #ecf5ff;
  color: #409eff;
}

.rol-card__badge--mentor {
  background: #f5eeff;
  color: #9b59b6;
}

/* ── Nota ────────────────────────────────────────────────────────────── */
.rol-nota {
  font-size: 0.78rem;
  color: var(--el-text-color-placeholder);
  margin: 0;
}
</style>

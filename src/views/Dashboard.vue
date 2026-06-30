<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/axios'
import {
  Calendar, Clock, StarFilled, UserFilled,
  Medal, Trophy, Finished, CircleCheckFilled,
  ArrowRight, SuccessFilled, WarnTriangleFilled, DataAnalysis
} from '@element-plus/icons-vue'

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user') || '{}')

// ── Estado ─────────────────────────────────────────────────────────────
const loadingSesiones    = ref(true)
const loadingValoraciones = ref(true)
const loadingPerfil      = ref(true)
const sesiones           = ref([])
const valoraciones       = ref([])
const tienePerfil        = ref(false)
const perfilData         = ref(null)
const mentoresMap        = ref({})

// ── Rol y estado ───────────────────────────────────────────────────────
const rolLabel = computed(() =>
  ({ 1: 'Estudiante', 2: 'Mentor', 3: 'Administrador' }[user.rol] || 'Usuario')
)

const saludo = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
})

// ── Stats computadas ───────────────────────────────────────────────────
const misSesiones = computed(() =>
  sesiones.value.filter(s => s.aprendiz_id === user.id || s.mentor_id === user.id)
)

const sesionesProximas = computed(() =>
  misSesiones.value
    .filter(s => ['pendiente', 'confirmada'].includes(s.estado))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
)

const sesionesCompletadas = computed(() =>
  misSesiones.value.filter(s => s.estado === 'completada')
)

const misValoraciones = computed(() =>
  valoraciones.value.filter(v => v.aprendiz_id === user.id)
)

const proximasSesiones3 = computed(() => sesionesProximas.value.slice(0, 3))

const stats = computed(() => [
  {
    label:   'Total sesiones',
    value:   misSesiones.value.length,
    icon:    Calendar,
    color:   '#409eff',
    bg:      '#ecf5ff',
    route:   'MisSesiones'
  },
  {
    label:   'Próximas',
    value:   sesionesProximas.value.length,
    icon:    Clock,
    color:   '#e6a23c',
    bg:      '#fdf6ec',
    route:   'MisSesiones'
  },
  {
    label:   'Completadas',
    value:   sesionesCompletadas.value.length,
    icon:    Finished,
    color:   '#67c23a',
    bg:      '#f0f9eb',
    route:   'MisSesiones'
  },
  {
    label:   'Valoraciones',
    value:   misValoraciones.value.length,
    icon:    StarFilled,
    color:   '#f7ba2a',
    bg:      '#fefbe8',
    route:   'MisValoraciones'
  }
])

// ── Accesos rápidos ────────────────────────────────────────────────────
const accesos = [
  { label: 'Mi Perfil',        icon: UserFilled,  route: 'UserPerfil',    color: '#409eff' },
  { label: 'Buscar Mentores',  icon: Medal,       route: 'BuscarMentores',color: '#9b59b6' },
  { label: 'Mis Sesiones',     icon: Calendar,    route: 'MisSesiones',   color: '#e6a23c' },
  { label: 'Mis Valoraciones', icon: Trophy,      route: 'MisValoraciones',color: '#f7ba2a'},
]

// ── Fetch data ─────────────────────────────────────────────────────────
async function fetchSesiones() {
  try {
    const { data } = await api.get('/sesiones')
    sesiones.value = Array.isArray(data) ? data : []

    // Cargar nombres de mentores para sesiones próximas
    const mentorIds = [...new Set(sesiones.value.map(s => s.mentor_id))]
    const { data: perfiles } = await api.get('/perfiles', {
      params: { ordenar_por: 'carrera', orden: 'asc' }
    })
    ;(perfiles.data || []).forEach(p => {
      mentoresMap.value[p.usuario_id] = p.usuario?.nombre || `Mentor #${p.usuario_id}`
    })
  } catch {
    // silencioso
  } finally {
    loadingSesiones.value = false
  }
}

async function fetchValoraciones() {
  try {
    const { data } = await api.get('/valoraciones')
    valoraciones.value = Array.isArray(data) ? data : []
  } catch {
    // silencioso
  } finally {
    loadingValoraciones.value = false
  }
}

async function fetchPerfil() {
  try {
    const { data } = await api.get(`/perfiles/${user.id}`)
    tienePerfil.value = true
    perfilData.value  = data
  } catch {
    tienePerfil.value = false
  } finally {
    loadingPerfil.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────────────
function formatFecha(fecha) {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

function formatHora(h) {
  return h ? h.substring(0, 5) : ''
}

function getNombreMentor(id) {
  return mentoresMap.value[id] || `Mentor #${id}`
}

function getTagType(estado) {
  return { pendiente: 'warning', confirmada: 'primary', completada: 'success', cancelada: 'info' }[estado] || 'info'
}

function getLetra(nombre) {
  return (nombre || 'U').charAt(0).toUpperCase()
}

onMounted(() => {
  fetchSesiones()
  fetchValoraciones()
  fetchPerfil()
})
</script>

<template>
  <div class="dash">

    <!-- ══ BIENVENIDA ════════════════════════════════════════════════════ -->
    <div class="dash-bienvenida">
      <div class="dash-bienvenida__left">
        <el-avatar :size="64" class="dash-avatar">
          {{ getLetra(user.nombre) }}
        </el-avatar>
        <div>
          <p class="dash-saludo">{{ saludo }},</p>
          <h1 class="dash-nombre">{{ user.nombre }}</h1>
          <div class="dash-meta">
            <span class="dash-email">{{ user.email }}</span>
            <el-tag size="small" type="primary" effect="light">{{ rolLabel }}</el-tag>
            <el-tag
              size="small"
              :type="user.estado === 'activo' ? 'success' : 'danger'"
              effect="light"
            >
              {{ user.estado }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- Alerta de perfil incompleto -->
      <el-alert
        v-if="!loadingPerfil && !tienePerfil"
        type="warning"
        :icon="WarnTriangleFilled"
        show-icon
        :closable="false"
        class="dash-alert"
      >
        <template #title>
          Tu perfil está incompleto.
          <el-button type="warning" link @click="router.push({ name: 'UserPerfil' })">
            Completarlo ahora →
          </el-button>
        </template>
      </el-alert>

      <el-tag
        v-else-if="!loadingPerfil && tienePerfil"
        type="success"
        size="large"
        :icon="CircleCheckFilled"
        effect="light"
      >
        Perfil completo
      </el-tag>
    </div>

    <!-- ══ STATS ══════════════════════════════════════════════════════════ -->
    <div class="dash-stats">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="stat-card"
        :style="{ '--stat-color': stat.color, '--stat-bg': stat.bg }"
        @click="router.push({ name: stat.route })"
      >
        <div class="stat-card__icon">
          <el-icon :size="24"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-card__body">
          <el-skeleton v-if="loadingSesiones && stat.label !== 'Valoraciones'" animated :rows="1" />
          <el-skeleton v-else-if="loadingValoraciones && stat.label === 'Valoraciones'" animated :rows="1" />
          <template v-else>
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </template>
        </div>
        <el-icon class="stat-card__arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- ══ CONTENIDO PRINCIPAL ════════════════════════════════════════════ -->
    <div class="dash-grid">

      <!-- ── Próximas sesiones ─────────────────────────────────────────── -->
      <el-card shadow="never" class="dash-card">
        <template #header>
          <div class="card-header">
            <div class="card-header__left">
              <el-icon color="#409eff"><Calendar /></el-icon>
              <span>Próximas sesiones</span>
            </div>
            <el-button
              link
              type="primary"
              size="small"
              @click="router.push({ name: 'MisSesiones' })"
            >
              Ver todas <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </template>

        <!-- Loading -->
        <div v-if="loadingSesiones">
          <el-skeleton v-for="i in 3" :key="i" :rows="2" animated style="margin-bottom:1rem" />
        </div>

        <!-- Vacío -->
        <div v-else-if="proximasSesiones3.length === 0" class="card-empty">
          <el-empty :image-size="80" description="Sin sesiones próximas" />
          <el-button
            type="primary"
            plain
            size="small"
            :icon="Calendar"
            @click="router.push({ name: 'MisSesiones' })"
          >
            Agendar sesión
          </el-button>
        </div>

        <!-- Lista -->
        <div v-else class="sesiones-lista">
          <div
            v-for="s in proximasSesiones3"
            :key="s.id"
            class="sesion-item"
          >
            <div class="sesion-item__fecha">
              <span class="sesion-dia">{{ formatFecha(s.fecha).substring(0,5) }}</span>
              <span class="sesion-hora">{{ formatHora(s.hora_inicio) }}</span>
            </div>

            <div class="sesion-item__info">
              <p class="sesion-mentor-nombre">{{ getNombreMentor(s.mentor_id) }}</p>
              <p class="sesion-duracion">
                {{ formatHora(s.hora_inicio) }} – {{ formatHora(s.hora_fin) }}
              </p>
            </div>

            <el-tag :type="getTagType(s.estado)" size="small" effect="light">
              {{ s.estado.charAt(0).toUpperCase() + s.estado.slice(1) }}
            </el-tag>
          </div>
        </div>
      </el-card>

      <!-- ── Columna derecha ───────────────────────────────────────────── -->
      <div class="dash-col-right">

        <!-- Estado del perfil -->
        <el-card shadow="never" class="dash-card">
          <template #header>
            <div class="card-header">
              <div class="card-header__left">
                <el-icon color="#9b59b6"><UserFilled /></el-icon>
                <span>Estado del perfil</span>
              </div>
            </div>
          </template>

          <el-skeleton v-if="loadingPerfil" :rows="3" animated />

          <div v-else-if="tienePerfil" class="perfil-estado">
            <el-avatar :size="48" class="perfil-avatar">
              {{ getLetra(user.nombre) }}
            </el-avatar>
            <div class="perfil-estado__info">
              <p class="perfil-carrera">{{ perfilData?.carrera || '—' }}</p>
              <p class="perfil-ciclo">Ciclo {{ perfilData?.ciclo }}</p>
              <p v-if="perfilData?.bio" class="perfil-bio">{{ perfilData.bio }}</p>
            </div>
            <el-button
              size="small"
              plain
              @click="router.push({ name: 'UserPerfil' })"
            >
              Editar
            </el-button>
          </div>

          <div v-else class="perfil-incompleto">
            <el-icon :size="40" color="#e6a23c"><WarnTriangleFilled /></el-icon>
            <p>Tu perfil está incompleto</p>
            <el-button
              type="primary"
              size="small"
              @click="router.push({ name: 'UserPerfil' })"
            >
              Completar perfil
            </el-button>
          </div>
        </el-card>

        <!-- Accesos rápidos -->
        <el-card shadow="never" class="dash-card">
          <template #header>
            <div class="card-header">
              <div class="card-header__left">
                <el-icon color="#67c23a"><DataAnalysis /></el-icon>
                <span>Accesos rápidos</span>
              </div>
            </div>
          </template>

          <div class="accesos-grid">
            <button
              v-for="a in accesos"
              :key="a.route"
              class="acceso-btn"
              :style="{ '--acceso-color': a.color }"
              @click="router.push({ name: a.route })"
            >
              <el-icon :size="22"><component :is="a.icon" /></el-icon>
              <span>{{ a.label }}</span>
            </button>
          </div>
        </el-card>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Página ──────────────────────────────────────────────────────────── */
.dash {
  padding: 1.5rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ══ BIENVENIDA ══════════════════════════════════════════════════════════ */
.dash-bienvenida {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  padding: 1.5rem;
}

.dash-bienvenida__left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.dash-avatar {
  flex-shrink: 0;
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--el-color-primary), #9b59b6);
  color: #fff;
}

.dash-saludo {
  margin: 0;
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
}

.dash-nombre {
  margin: 0.1rem 0 0.4rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--el-text-color-primary);
}

.dash-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.dash-email {
  font-size: 0.82rem;
  color: var(--el-text-color-secondary);
}

.dash-alert {
  max-width: 360px;
}

/* ══ STATS ═══════════════════════════════════════════════════════════════ */
.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 860px) {
  .dash-stats { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .dash-stats { grid-template-columns: 1fr 1fr; }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,.08);
}

.stat-card__icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--stat-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--stat-color);
}

.stat-card__body {
  flex: 1;
  min-width: 0;
}

.stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--el-text-color-primary);
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: 0.78rem;
  color: var(--el-text-color-secondary);
  margin-top: 0.25rem;
}

.stat-card__arrow {
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

/* ══ GRID PRINCIPAL ══════════════════════════════════════════════════════ */
.dash-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 1rem;
  align-items: start;
}

@media (max-width: 860px) {
  .dash-grid { grid-template-columns: 1fr; }
}

.dash-col-right {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ══ CARDS ════════════════════════════════════════════════════════════════ */
.dash-card {
  border-radius: 14px !important;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header__left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.card-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

/* ══ SESIONES PRÓXIMAS ════════════════════════════════════════════════════ */
.sesiones-lista {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sesion-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
  transition: background 0.15s;
}

.sesion-item:hover {
  background: var(--el-fill-color-light);
}

.sesion-item__fecha {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 44px;
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  padding: 0.4rem 0.5rem;
}

.sesion-dia {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--el-color-primary);
  line-height: 1;
}

.sesion-hora {
  font-size: 0.7rem;
  color: var(--el-color-primary-light-3);
  margin-top: 2px;
}

.sesion-item__info {
  flex: 1;
  min-width: 0;
}

.sesion-mentor-nombre {
  margin: 0 0 0.1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sesion-duracion {
  margin: 0;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
}

/* ══ PERFIL ESTADO ════════════════════════════════════════════════════════ */
.perfil-estado {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
}

.perfil-avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--el-color-primary), #9b59b6);
  color: #fff;
  font-weight: 800;
}

.perfil-estado__info {
  flex: 1;
  min-width: 0;
}

.perfil-carrera {
  margin: 0 0 0.1rem;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--el-text-color-primary);
}

.perfil-ciclo {
  margin: 0 0 0.35rem;
  font-size: 0.78rem;
  color: var(--el-text-color-secondary);
}

.perfil-bio {
  margin: 0;
  font-size: 0.78rem;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.perfil-incompleto {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
}

.perfil-incompleto p { margin: 0; }

/* ══ ACCESOS RÁPIDOS ══════════════════════════════════════════════════════ */
.accesos-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.acceso-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 0.5rem;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--acceso-color);
  transition: background 0.15s, transform 0.15s;
  text-align: center;
}

.acceso-btn:hover {
  background: var(--el-fill-color-lighter);
  transform: translateY(-1px);
}

@media (max-width: 500px) {
  .dash { padding: 1rem; }
}
</style>

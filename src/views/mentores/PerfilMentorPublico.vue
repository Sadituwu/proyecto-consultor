<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/axios'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Calendar, Timer, ChatDotSquare, StarFilled
} from '@element-plus/icons-vue'

const route  = useRoute()
const router = useRouter()

// ── Estado ─────────────────────────────────────────────────────────────
const loading      = ref(false)
const notFound     = ref(false)
const perfil       = ref(null)
const loadingResenas = ref(false)
const resenas       = ref([])

const ratingColors = {
  1: '#f56c6c',
  2: '#e6a23c',
  3: '#e6a23c',
  4: '#67c23a',
  5: '#409eff'
}

// ── Computed ───────────────────────────────────────────────────────────
const promedio = computed(() => {
  const val = perfil.value?.valoraciones_avg_calificacion
  return val ? Number(val) : 0
})

const promedioDisplay = computed(() => promedio.value ? promedio.value.toFixed(1) : null)

const totalValoraciones = computed(() => perfil.value?.valoraciones_count ?? 0)

// ── Carga de datos ─────────────────────────────────────────────────────
async function cargarPerfil() {
  loading.value = true
  notFound.value = false
  try {
    const { data } = await api.get(`/perfiles/${route.params.id}`)
    perfil.value = data
  } catch (err) {
    if (err.response?.status === 404) {
      notFound.value = true
    } else {
      ElMessage.error('Error al cargar el perfil del mentor')
    }
  } finally {
    loading.value = false
  }
}

async function cargarResenas() {
  loadingResenas.value = true
  try {
    const { data } = await api.get(`/perfiles/${route.params.id}/valoraciones`)
    resenas.value = Array.isArray(data.data) ? data.data : []
  } catch {
    // No crítico — la página sigue siendo útil sin reseñas
  } finally {
    loadingResenas.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────────────
function getHabilidades(str) {
  if (!str) return []
  return str.split(',').map(h => h.trim()).filter(Boolean)
}

function getDisponibilidad(str) {
  if (!str) return []
  return str.split(',').map(d => d.trim()).filter(Boolean)
}

function getLetra(nombre) {
  return nombre?.charAt(0)?.toUpperCase() || 'M'
}

function formatFecha(fecha) {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

function goBack() {
  router.back()
}

function solicitarSesion() {
  router.push({ name: 'MisSesiones', query: { mentor_id: route.params.id } })
}

onMounted(async () => {
  await cargarPerfil()
  if (perfil.value) cargarResenas()
})
</script>

<template>
  <div class="perfil-publico-page">

    <el-page-header title="Volver" :icon="ArrowLeft" @back="goBack">
      <template #content>Perfil del mentor</template>
    </el-page-header>

    <!-- ══ LOADING ═══════════════════════════════════════════════════════ -->
    <div v-if="loading" class="loading-state">
      <el-card shadow="never">
        <el-skeleton :rows="6" animated />
      </el-card>
    </div>

    <!-- ══ NO ENCONTRADO ═════════════════════════════════════════════════ -->
    <div v-else-if="notFound" class="empty-state">
      <el-empty :image-size="120">
        <template #description>
          <p class="empty-title">Este mentor no tiene un perfil disponible</p>
          <p class="empty-subtitle">Puede que aún no haya completado su perfil o ya no esté activo.</p>
        </template>
        <el-button type="primary" @click="goBack">Volver a la búsqueda</el-button>
      </el-empty>
    </div>

    <!-- ══ CONTENIDO ═════════════════════════════════════════════════════ -->
    <template v-else-if="perfil">

      <!-- Cabecera -->
      <el-card shadow="never" class="perfil-card">
        <div class="perfil-header">
          <el-avatar :size="88" :src="perfil.foto_url || ''" class="perfil-avatar">
            {{ getLetra(perfil.usuario?.nombre) }}
          </el-avatar>
          <div class="perfil-header__info">
            <h1 class="perfil-nombre">{{ perfil.usuario?.nombre }}</h1>
            <div class="perfil-tags">
              <el-tag type="primary" effect="light">{{ perfil.carrera }}</el-tag>
              <el-tag type="info" effect="plain">Ciclo {{ perfil.ciclo }}</el-tag>
            </div>
            <div class="perfil-rating">
              <el-rate :model-value="promedio" disabled allow-half :colors="['#f7ba2a', '#f7ba2a', '#ff9900']" />
              <span v-if="promedioDisplay" class="rating-valor">
                {{ promedioDisplay }} · {{ totalValoraciones }} valoración{{ totalValoraciones !== 1 ? 'es' : '' }}
              </span>
              <span v-else class="rating-sin">Sin valoraciones aún</span>
            </div>
          </div>
          <el-button type="primary" size="large" :icon="Calendar" @click="solicitarSesion" class="btn-solicitar">
            Solicitar sesión
          </el-button>
        </div>
      </el-card>

      <!-- Descripción -->
      <el-card shadow="never" class="seccion-card">
        <p class="seccion-label">Descripción profesional</p>
        <p class="seccion-bio">{{ perfil.bio }}</p>
      </el-card>

      <!-- Especialidades -->
      <el-card v-if="getHabilidades(perfil.habilidades).length" shadow="never" class="seccion-card">
        <p class="seccion-label">Especialidades y habilidades</p>
        <div class="tags-wrap">
          <el-tag v-for="h in getHabilidades(perfil.habilidades)" :key="h" type="success" effect="light">
            {{ h }}
          </el-tag>
        </div>
      </el-card>

      <!-- Disponibilidad -->
      <el-card v-if="getDisponibilidad(perfil.disponibilidad).length" shadow="never" class="seccion-card">
        <p class="seccion-label">Disponibilidad</p>
        <div class="tags-wrap">
          <el-tag
            v-for="d in getDisponibilidad(perfil.disponibilidad)"
            :key="d"
            type="warning"
            effect="light"
            :icon="Timer"
          >
            {{ d }}
          </el-tag>
        </div>
      </el-card>

      <!-- Reseñas -->
      <el-card shadow="never" class="seccion-card">
        <p class="seccion-label">Reseñas de aprendices</p>

        <div v-if="loadingResenas" class="resenas-loading">
          <el-skeleton :rows="2" animated />
        </div>

        <div v-else-if="resenas.length === 0" class="sin-resenas">
          Este mentor aún no tiene reseñas escritas.
        </div>

        <div v-else class="resenas-lista">
          <div v-for="r in resenas" :key="r.id" class="resena-item">
            <el-avatar :size="36" class="resena-avatar">
              {{ getLetra(r.aprendiz?.nombre) }}
            </el-avatar>
            <div class="resena-cuerpo">
              <div class="resena-cabecera">
                <span class="resena-nombre">{{ r.aprendiz?.nombre || 'Aprendiz' }}</span>
                <el-rate :model-value="r.calificacion" disabled size="small" :colors="['#f7ba2a', '#f7ba2a', '#ff9900']" />
                <span class="resena-fecha">{{ formatFecha(r.fecha_creacion?.substring(0, 10)) }}</span>
              </div>
              <p class="resena-comentario">
                <el-icon><ChatDotSquare /></el-icon>
                {{ r.comentario }}
              </p>
            </div>
          </div>
        </div>
      </el-card>

    </template>

  </div>
</template>

<style scoped>
.perfil-publico-page {
  padding: 1.5rem 2rem;
  max-width: 760px;
  margin: 0 auto;
}

.loading-state,
.perfil-card,
.seccion-card {
  margin-top: 1.25rem;
  border-radius: 12px !important;
}

.empty-state {
  padding: 3rem 1rem;
  text-align: center;
}

.empty-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 0.4rem;
  color: var(--el-text-color-primary);
}

.empty-subtitle {
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
  margin: 0 0 1.25rem;
}

/* ── Cabecera ────────────────────────────────────────────────────────── */
.perfil-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.perfil-avatar {
  flex-shrink: 0;
  font-size: 2rem;
  font-weight: 700;
  background-color: var(--el-color-primary);
  color: #fff;
}

.perfil-header__info {
  flex: 1;
  min-width: 200px;
}

.perfil-nombre {
  margin: 0 0 0.4rem;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.perfil-tags {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.perfil-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-valor {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--el-color-warning);
}

.rating-sin {
  font-size: 0.8rem;
  color: var(--el-text-color-placeholder);
}

.btn-solicitar {
  flex-shrink: 0;
}

/* ── Secciones ───────────────────────────────────────────────────────── */
.seccion-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--el-text-color-secondary);
  margin: 0 0 0.75rem;
}

.seccion-bio {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
  line-height: 1.65;
  margin: 0;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* ── Reseñas ─────────────────────────────────────────────────────────── */
.sin-resenas {
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
  padding: 0.5rem 0;
}

.resenas-lista {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.resena-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.resena-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.resena-avatar {
  flex-shrink: 0;
  background-color: var(--el-color-success);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}

.resena-cuerpo {
  flex: 1;
  min-width: 0;
}

.resena-cabecera {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 0.3rem;
}

.resena-nombre {
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--el-text-color-primary);
}

.resena-fecha {
  font-size: 0.75rem;
  color: var(--el-text-color-placeholder);
}

.resena-comentario {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  margin: 0;
  font-size: 0.85rem;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

@media (max-width: 600px) {
  .perfil-publico-page { padding: 1rem; }
  .perfil-header { flex-direction: column; align-items: flex-start; }
  .btn-solicitar { width: 100%; }
}
</style>

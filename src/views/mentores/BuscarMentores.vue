<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/axios'
import { ElMessage } from 'element-plus'
import { Search, Refresh, UserFilled, StarFilled, Timer, Filter, Close, Medal, Collection, Calendar } from '@element-plus/icons-vue'

const router = useRouter()

// ── Estado principal ───────────────────────────────────────────────────
const loading = ref(false)
const mentores = ref([])
const total = ref(0)
const paginaActual = ref(1)
const POR_PAGINA = 5

const detailVisible = ref(false)
const mentorDetalle = ref(null)

let debounceTimer = null

// ── Filtros ────────────────────────────────────────────────────────────
const filtros = reactive({
  carrera: '',
  habilidad: '',
  ciclo: '',
  ordenar: 'valoraciones_avg_calificacion__desc'
})

const ciclosOptions = [
  { label: 'Todos los ciclos', value: '' },
  ...Array.from({ length: 12 }, (_, i) => ({ label: `Ciclo ${i + 1}`, value: i + 1 }))
]

const ordenOptions = [
  { label: 'Mejor valorados', value: 'valoraciones_avg_calificacion__desc' },
  { label: 'Más recientes', value: 'fecha_actualizacion__desc' },
  { label: 'Ciclo: menor→mayor', value: 'ciclo__asc' },
  { label: 'Ciclo: mayor→menor', value: 'ciclo__desc' },
  { label: 'Carrera A-Z', value: 'carrera__asc' },
]

// ── Computed ───────────────────────────────────────────────────────────
const hayFiltrosActivos = computed(() =>
  filtros.carrera || filtros.habilidad || filtros.ciclo !== '' ||
  filtros.ordenar !== 'valoraciones_avg_calificacion__desc'
)

const mensajeResultados = computed(() => {
  if (loading.value) return ''
  if (total.value === 0) return ''
  const desde = (paginaActual.value - 1) * POR_PAGINA + 1
  const hasta = Math.min(paginaActual.value * POR_PAGINA, total.value)
  return `Mostrando ${desde}–${hasta} de ${total.value} mentores`
})

// ── API ────────────────────────────────────────────────────────────────
async function buscar(page = 1) {
  loading.value = true
  paginaActual.value = page

  const [ordenar_por, orden] = filtros.ordenar.split('__')
  const params = { page, ordenar_por, orden }
  if (filtros.carrera) params.carrera = filtros.carrera
  if (filtros.habilidad) params.habilidad = filtros.habilidad
  if (filtros.ciclo !== '') params.ciclo = filtros.ciclo

  try {
    const { data } = await api.get('/perfiles', { params })
    mentores.value = data.data
    total.value = data.total
  } catch {
    ElMessage.error('Error al buscar mentores. Verifica tu conexión.')
  } finally {
    loading.value = false
  }
}

function buscarDebounced() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => buscar(1), 420)
}

function limpiarFiltros() {
  filtros.carrera = ''
  filtros.habilidad = ''
  filtros.ciclo = ''
  filtros.ordenar = 'valoraciones_avg_calificacion__desc'
  buscar(1)
}

function cambiarPagina(page) {
  buscar(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Helpers de tarjeta ─────────────────────────────────────────────────
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

function getRating(val) {
  return val ? Number(val) : 0
}

function getRatingDisplay(val) {
  return val ? Number(val).toFixed(1) : null
}

function verDetalle(mentor) {
  mentorDetalle.value = mentor
  detailVisible.value = true
}

// ── Watchers ───────────────────────────────────────────────────────────
watch([() => filtros.carrera, () => filtros.habilidad], buscarDebounced)
watch([() => filtros.ciclo, () => filtros.ordenar], () => buscar(1))

onMounted(() => buscar(1))
</script>

<template>
  <div class="mentores-page">

    <!-- ══ CABECERA ══════════════════════════════════════════════════════ -->
    <div class="mentores-header">
      <div class="mentores-header__left">
        <h1 class="mentores-title">
          <el-icon>
            <Medal />
          </el-icon>
          Buscar Mentores
        </h1>
        <p class="mentores-subtitle">Encuentra al mentor ideal según tu carrera y especialidad</p>
      </div>

      <el-tag v-if="!loading && total > 0" type="primary" size="large" effect="plain">
        {{ total }} mentor{{ total !== 1 ? 'es' : '' }} disponible{{ total !== 1 ? 's' : '' }}
      </el-tag>
    </div>

    <!-- ══ PANEL DE FILTROS ══════════════════════════════════════════════ -->
    <el-card shadow="never" class="filtros-card">
      <div class="filtros-grid">

        <!-- Carrera -->
        <div class="filtro-item filtro-item--wide">
          <label class="filtro-label">Carrera / Área</label>
          <el-input v-model="filtros.carrera" placeholder="Ej: Ingeniería de Sistemas" :prefix-icon="Search" clearable
            @clear="buscar(1)" />
        </div>

        <!-- Habilidad / Especialidad -->
        <div class="filtro-item filtro-item--wide">
          <label class="filtro-label">Especialidad / Habilidad</label>
          <el-input v-model="filtros.habilidad" placeholder="Ej: Vue.js, Python, SQL..." :prefix-icon="Collection"
            clearable @clear="buscar(1)" />
        </div>

        <!-- Ciclo -->
        <div class="filtro-item">
          <label class="filtro-label">Ciclo</label>
          <el-select v-model="filtros.ciclo" placeholder="Todos" class="w-full">
            <el-option v-for="c in ciclosOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </div>

        <!-- Ordenar -->
        <div class="filtro-item">
          <label class="filtro-label">Ordenar por</label>
          <el-select v-model="filtros.ordenar" class="w-full">
            <el-option v-for="o in ordenOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </div>

        <!-- Botón limpiar -->
        <div class="filtro-item filtro-item--action">
          <label class="filtro-label">&nbsp;</label>
          <el-button :disabled="!hayFiltrosActivos || loading" :icon="Refresh" @click="limpiarFiltros">
            Limpiar
          </el-button>
        </div>

      </div>

      <!-- Chips de filtros activos -->
      <div v-if="hayFiltrosActivos" class="filtros-activos">
        <span class="filtros-activos__label">Filtros activos:</span>
        <el-tag v-if="filtros.carrera" closable type="info" size="small" @close="filtros.carrera = ''">
          Carrera: {{ filtros.carrera }}
        </el-tag>
        <el-tag v-if="filtros.habilidad" closable type="info" size="small" @close="filtros.habilidad = ''">
          Habilidad: {{ filtros.habilidad }}
        </el-tag>
        <el-tag v-if="filtros.ciclo !== ''" closable type="info" size="small" @close="filtros.ciclo = ''">
          Ciclo {{ filtros.ciclo }}
        </el-tag>
      </div>
    </el-card>

    <!-- ══ LOADING: SKELETONS ════════════════════════════════════════════ -->
    <div v-if="loading" class="mentores-grid">
      <el-card v-for="i in POR_PAGINA" :key="i" shadow="never" class="mentor-card">
        <el-skeleton :rows="5" animated />
      </el-card>
    </div>

    <!-- ══ ESTADO VACÍO ══════════════════════════════════════════════════ -->
    <div v-else-if="!loading && mentores.length === 0" class="empty-state">
      <el-empty :image-size="140" description="No se encontraron mentores con esos criterios">
        <template #description>
          <p class="empty-title">Sin resultados</p>
          <p class="empty-subtitle">
            {{ hayFiltrosActivos
              ? 'Intenta ampliar tu búsqueda o cambiar los filtros aplicados.'
              : 'Aún no hay mentores registrados en la plataforma.' }}
          </p>
        </template>
        <el-button v-if="hayFiltrosActivos" type="primary" :icon="Refresh" @click="limpiarFiltros">
          Limpiar filtros
        </el-button>
      </el-empty>
    </div>

    <!-- ══ GRID DE RESULTADOS ════════════════════════════════════════════ -->
    <template v-else>
      <p class="resultados-info">{{ mensajeResultados }}</p>

      <div class="mentores-grid">
        <el-card v-for="mentor in mentores" :key="mentor.id" shadow="hover" class="mentor-card">
          <!-- Cabecera de la tarjeta -->
          <div class="mentor-card__header">
            <el-avatar :size="56" :src="mentor.foto_url || ''" class="mentor-avatar">
              {{ getLetra(mentor.usuario?.nombre) }}
            </el-avatar>

            <div class="mentor-card__info">
              <p class="mentor-nombre">{{ mentor.usuario?.nombre }}</p>
              <p class="mentor-email">{{ mentor.usuario?.email }}</p>

              <!-- Rating -->
              <div class="mentor-rating">
                <el-rate :model-value="getRating(mentor.valoraciones_avg_calificacion)" disabled
                  :colors="['#f7ba2a', '#f7ba2a', '#ff9900']" size="small" />
                <span v-if="getRatingDisplay(mentor.valoraciones_avg_calificacion)" class="rating-valor">
                  {{ getRatingDisplay(mentor.valoraciones_avg_calificacion) }}
                </span>
                <span v-else class="rating-sin">Sin valoraciones</span>
              </div>
            </div>
          </div>

          <!-- Carrera y ciclo -->
          <div class="mentor-card__meta">
            <el-tag type="primary" size="small" effect="light">
              {{ mentor.carrera }}
            </el-tag>
            <el-tag type="info" size="small" effect="plain">
              Ciclo {{ mentor.ciclo }}
            </el-tag>
          </div>

          <!-- Bio truncada -->
          <p class="mentor-bio">{{ mentor.bio }}</p>

          <!-- Habilidades -->
          <div v-if="getHabilidades(mentor.habilidades).length" class="mentor-habilidades">
            <el-tag v-for="h in getHabilidades(mentor.habilidades).slice(0, 3)" :key="h" size="small" type="success"
              effect="light">
              {{ h }}
            </el-tag>
            <el-tag v-if="getHabilidades(mentor.habilidades).length > 3" size="small" type="info" effect="plain">
              +{{ getHabilidades(mentor.habilidades).length - 3 }}
            </el-tag>
          </div>

          <!-- Disponibilidad -->
          <div v-if="getDisponibilidad(mentor.disponibilidad).length" class="mentor-disponibilidad">
            <el-icon class="disponibilidad-icon">
              <Timer />
            </el-icon>
            <span>{{ getDisponibilidad(mentor.disponibilidad).join(' · ') }}</span>
          </div>

          <!-- Acción -->
          <div class="mentor-card__footer">
            <el-button type="primary" size="small" plain class="w-full" @click="verDetalle(mentor)">
              Ver perfil completo
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- ── Paginación ──────────────────────────────────────────────── -->
      <div class="mentores-pagination">
        <el-pagination v-model:current-page="paginaActual" :page-size="POR_PAGINA" :total="total"
          layout="prev, pager, next, jumper" background @current-change="cambiarPagina" />
      </div>
    </template>

    <!-- ══ MODAL DETALLE ═════════════════════════════════════════════════ -->
    <el-dialog v-model="detailVisible" :title="mentorDetalle?.usuario?.nombre" width="600px" align-center
      destroy-on-close>
      <div v-if="mentorDetalle" class="detalle-contenido">

        <!-- Avatar + info básica -->
        <div class="detalle-header">
          <el-avatar :size="80" :src="mentorDetalle.foto_url || ''" class="detalle-avatar">
            {{ getLetra(mentorDetalle.usuario?.nombre) }}
          </el-avatar>
          <div>
            <h3 class="detalle-nombre">{{ mentorDetalle.usuario?.nombre }}</h3>
            <p class="detalle-email">{{ mentorDetalle.usuario?.email }}</p>
            <div class="mentor-rating mt-1">
              <el-rate :model-value="getRating(mentorDetalle.valoraciones_avg_calificacion)" disabled show-score
                :score-template="getRatingDisplay(mentorDetalle.valoraciones_avg_calificacion)
                  ? `${getRatingDisplay(mentorDetalle.valoraciones_avg_calificacion)} / 5.0`
                  : 'Sin valoraciones'" />
            </div>
          </div>
        </div>

        <el-divider />

        <!-- Carrera y ciclo -->
        <div class="detalle-seccion">
          <p class="detalle-seccion__label">Carrera / Área</p>
          <div class="flex gap-2 flex-wrap">
            <el-tag type="primary" effect="light">{{ mentorDetalle.carrera }}</el-tag>
            <el-tag type="info" effect="plain">Ciclo {{ mentorDetalle.ciclo }}</el-tag>
          </div>
        </div>

        <!-- Bio completa -->
        <div class="detalle-seccion">
          <p class="detalle-seccion__label">Descripción profesional</p>
          <p class="detalle-bio">{{ mentorDetalle.bio }}</p>
        </div>

        <!-- Habilidades completas -->
        <div v-if="getHabilidades(mentorDetalle.habilidades).length" class="detalle-seccion">
          <p class="detalle-seccion__label">Especialidades y habilidades</p>
          <div class="flex flex-wrap gap-2">
            <el-tag v-for="h in getHabilidades(mentorDetalle.habilidades)" :key="h" type="success" effect="light"
              size="small">
              {{ h }}
            </el-tag>
          </div>
        </div>

        <!-- Disponibilidad completa -->
        <div v-if="getDisponibilidad(mentorDetalle.disponibilidad).length" class="detalle-seccion">
          <p class="detalle-seccion__label">Disponibilidad</p>
          <div class="flex flex-wrap gap-2">
            <el-tag v-for="d in getDisponibilidad(mentorDetalle.disponibilidad)" :key="d" type="warning" effect="light"
              size="small" :icon="Timer">
              {{ d }}
            </el-tag>
          </div>
        </div>

      </div>

      <template #footer>
        <el-button @click="detailVisible = false">Cerrar</el-button>
        <el-button
          type="primary"
          :icon="Calendar"
          @click="() => { detailVisible = false; router.push({ name: 'MisSesiones', query: { mentor_id: mentorDetalle.usuario_id } }) }"
        >
          Agendar sesión
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<style scoped>
/* ── Página ──────────────────────────────────────────────────────────── */
.mentores-page {
  padding: 1.5rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

/* ── Cabecera ────────────────────────────────────────────────────────── */
.mentores-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.mentores-header__left {}

.mentores-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: var(--el-text-color-primary);
}

.mentores-subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
}

/* ── Panel de filtros ────────────────────────────────────────────────── */
.filtros-card {
  margin-bottom: 1.5rem;
  border-radius: 12px !important;
}

.filtros-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.filtro-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 140px;
  flex: 1;
}

.filtro-item--wide {
  flex: 2;
  min-width: 200px;
}

.filtro-item--action {
  flex: 0 0 auto;
}

.filtro-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Filtros activos (chips) ─────────────────────────────────────────── */
.filtros-activos {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.875rem;
  padding-top: 0.875rem;
  border-top: 1px solid var(--el-border-color-lighter);
}

.filtros-activos__label {
  font-size: 0.78rem;
  color: var(--el-text-color-secondary);
  font-weight: 600;
}

/* ── Info de resultados ──────────────────────────────────────────────── */
.resultados-info {
  font-size: 0.82rem;
  color: var(--el-text-color-secondary);
  margin: 0 0 0.875rem;
}

/* ── Grid de tarjetas ────────────────────────────────────────────────── */
.mentores-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 900px) {
  .mentores-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 580px) {
  .mentores-grid {
    grid-template-columns: 1fr;
  }

  .mentores-page {
    padding: 1rem;
  }
}

/* ── Tarjeta de mentor ───────────────────────────────────────────────── */
.mentor-card {
  border-radius: 12px !important;
  display: flex;
  flex-direction: column;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.mentor-card:hover {
  transform: translateY(-2px);
}

.mentor-card__header {
  display: flex;
  gap: 0.875rem;
  align-items: flex-start;
  margin-bottom: 0.875rem;
}

.mentor-avatar {
  flex-shrink: 0;
  font-size: 1.25rem;
  font-weight: 700;
  background-color: var(--el-color-primary);
  color: #fff;
}

.mentor-card__info {
  flex: 1;
  min-width: 0;
}

.mentor-nombre {
  margin: 0 0 0.1rem;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mentor-email {
  margin: 0 0 0.3rem;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Rating ──────────────────────────────────────────────────────────── */
.mentor-rating {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.rating-valor {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--el-color-warning);
}

.rating-sin {
  font-size: 0.72rem;
  color: var(--el-text-color-placeholder);
}

/* ── Meta (carrera + ciclo) ──────────────────────────────────────────── */
.mentor-card__meta {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

/* ── Bio ─────────────────────────────────────────────────────────────── */
.mentor-bio {
  margin: 0 0 0.75rem;
  font-size: 0.82rem;
  color: var(--el-text-color-regular);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Habilidades ─────────────────────────────────────────────────────── */
.mentor-habilidades {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.6rem;
}

/* ── Disponibilidad ──────────────────────────────────────────────────── */
.mentor-disponibilidad {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.disponibilidad-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

/* ── Footer de tarjeta ───────────────────────────────────────────────── */
.mentor-card__footer {
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* ── Paginación ──────────────────────────────────────────────────────── */
.mentores-pagination {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

/* ── Estado vacío ────────────────────────────────────────────────────── */
.empty-state {
  padding: 3rem 1rem;
  text-align: center;
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.4rem;
  color: var(--el-text-color-primary);
}

.empty-subtitle {
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
  margin: 0 0 1.25rem;
  max-width: 360px;
  margin-inline: auto;
  line-height: 1.5;
}

/* ── Modal detalle ───────────────────────────────────────────────────── */
.detalle-contenido {
  padding: 0 0.25rem;
}

.detalle-header {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
  margin-bottom: 0.25rem;
}

.detalle-avatar {
  flex-shrink: 0;
  font-size: 1.75rem;
  font-weight: 700;
  background-color: var(--el-color-primary);
  color: #fff;
}

.detalle-nombre {
  margin: 0 0 0.2rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.detalle-email {
  margin: 0;
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
}

.detalle-seccion {
  margin-bottom: 1.1rem;
}

.detalle-seccion__label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--el-text-color-secondary);
  margin: 0 0 0.5rem;
}

.detalle-bio {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
  line-height: 1.65;
  margin: 0;
}

.mt-1 {
  margin-top: 0.25rem;
}

.flex {
  display: flex;
}

.flex-wrap {
  flex-wrap: wrap;
}

.gap-2 {
  gap: 0.5rem;
}

.w-full {
  width: 100%;
}
</style>

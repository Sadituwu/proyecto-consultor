<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import api from '@/services/axios'
import { ElMessage } from 'element-plus'
import {
  Trophy, StarFilled, ChatDotSquare,
  CircleCheck, Edit, Warning, Finished
} from '@element-plus/icons-vue'

const user = JSON.parse(localStorage.getItem('user') || '{}')

// ── Estado ─────────────────────────────────────────────────────────────
const loadingSesiones    = ref(false)
const loadingValoraciones = ref(false)
const guardando          = ref(false)
const sesiones           = ref([])
const valoraciones       = ref([])
const mentoresMap        = ref({})
const filtroTab          = ref('pendientes')
const dialogVisible      = ref(false)
const sesionSeleccionada = ref(null)
const formRef            = ref(null)

// ── Formulario ─────────────────────────────────────────────────────────
const form = reactive({
  calificacion: 0,
  comentario:   ''
})

// ── Validaciones ───────────────────────────────────────────────────────
const rules = {
  calificacion: [
    {
      validator: (rule, value, callback) => {
        if (!value || value < 1) callback(new Error('Selecciona una calificación de 1 a 5 estrellas'))
        else callback()
      },
      trigger: 'change'
    }
  ],
  comentario: [
    { max: 500, message: 'Máximo 500 caracteres', trigger: 'blur' }
  ]
}

// ── Labels de rating ───────────────────────────────────────────────────
const ratingLabels = {
  1: 'Muy malo',
  2: 'Malo',
  3: 'Regular',
  4: 'Bueno',
  5: 'Excelente'
}

const ratingColors = {
  1: '#f56c6c',
  2: '#e6a23c',
  3: '#e6a23c',
  4: '#67c23a',
  5: '#409eff'
}

// ── Computed ───────────────────────────────────────────────────────────
const valoracionesMap = computed(() => {
  const map = {}
  valoraciones.value.forEach(v => { map[v.sesion_id] = v })
  return map
})

const sesionesCompletadas = computed(() =>
  sesiones.value.filter(s =>
    s.estado === 'completada' && s.aprendiz_id === user.id
  )
)

const sesionesPendientes = computed(() =>
  sesionesCompletadas.value.filter(s => !valoracionesMap.value[s.id])
)

const sesionesValoradas = computed(() =>
  sesionesCompletadas.value.filter(s => valoracionesMap.value[s.id])
)

const listaMostrada = computed(() =>
  filtroTab.value === 'pendientes' ? sesionesPendientes.value : sesionesValoradas.value
)

const labelCalificacion = computed(() => ratingLabels[form.calificacion] || '')
const colorCalificacion = computed(() => ratingColors[form.calificacion] || '#c6d1de')

// ── Carga de datos ─────────────────────────────────────────────────────
async function cargarSesiones() {
  loadingSesiones.value = true
  try {
    const { data } = await api.get('/sesiones')
    sesiones.value = Array.isArray(data) ? data : []
  } catch {
    ElMessage.error('Error al cargar las sesiones')
  } finally {
    loadingSesiones.value = false
  }
}

async function cargarValoraciones() {
  loadingValoraciones.value = true
  try {
    const { data } = await api.get('/valoraciones')
    valoraciones.value = Array.isArray(data) ? data : []
  } catch {
    ElMessage.error('Error al cargar las valoraciones')
  } finally {
    loadingValoraciones.value = false
  }
}

async function cargarMentores() {
  try {
    const { data } = await api.get('/perfiles', {
      params: { ordenar_por: 'carrera', orden: 'asc' }
    })
    const lista = data.data || []
    lista.forEach(m => {
      mentoresMap.value[m.usuario_id] = {
        nombre:  m.usuario?.nombre || `Mentor #${m.usuario_id}`,
        carrera: m.carrera || ''
      }
    })
  } catch {
    // No crítico
  }
}

// ── Abrir diálogo ──────────────────────────────────────────────────────
function abrirValorar(sesion) {
  sesionSeleccionada.value = sesion
  form.calificacion = 0
  form.comentario   = ''
  formRef.value?.resetFields()
  dialogVisible.value = true
}

// ── Enviar valoración ──────────────────────────────────────────────────
async function enviarValoracion() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  guardando.value = true
  const sesion = sesionSeleccionada.value

  try {
    await api.post('/valoraciones', {
      sesion_id:    sesion.id,
      mentor_id:    sesion.mentor_id,
      aprendiz_id:  user.id,
      calificacion: form.calificacion,
      comentario:   form.comentario || null
    })

    ElMessage.success('¡Valoración enviada correctamente!')
    dialogVisible.value = false
    await cargarValoraciones()
  } catch (err) {
    if (err.response?.status === 409) {
      ElMessage.warning('Esta sesión ya fue valorada')
      dialogVisible.value = false
      await cargarValoraciones()
    } else if (err.response?.data?.errores) {
      const msg = Object.values(err.response.data.errores)[0]?.[0]
      ElMessage.error(msg || 'Error de validación')
    } else {
      ElMessage.error(err.response?.data?.mensaje || 'No se pudo enviar la valoración')
    }
  } finally {
    guardando.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────────────
function formatFecha(fecha) {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

function formatHora(hora) {
  return hora ? hora.substring(0, 5) : ''
}

function getNombreMentor(id) {
  return mentoresMap.value[id]?.nombre || `Mentor #${id}`
}

function getCarreraMentor(id) {
  return mentoresMap.value[id]?.carrera || ''
}

function getLetra(id) {
  return getNombreMentor(id).charAt(0).toUpperCase()
}

onMounted(() => Promise.all([cargarSesiones(), cargarValoraciones(), cargarMentores()]))
</script>

<template>
  <div class="valoraciones-page">

    <!-- ══ CABECERA ══════════════════════════════════════════════════════ -->
    <div class="valoraciones-header">
      <div>
        <h1 class="valoraciones-title">
          <el-icon><Trophy /></el-icon>
          Mis Valoraciones
        </h1>
        <p class="valoraciones-subtitle">
          Califica las sesiones de mentoría que has completado
        </p>
      </div>

      <!-- Resumen rápido -->
      <div class="valoraciones-resumen">
        <div class="resumen-item">
          <span class="resumen-num resumen-num--warning">{{ sesionesPendientes.length }}</span>
          <span class="resumen-label">Por valorar</span>
        </div>
        <div class="resumen-divider" />
        <div class="resumen-item">
          <span class="resumen-num resumen-num--success">{{ sesionesValoradas.length }}</span>
          <span class="resumen-label">Valoradas</span>
        </div>
      </div>
    </div>

    <!-- ══ TABS ══════════════════════════════════════════════════════════ -->
    <div class="tabs-filtro">
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': filtroTab === 'pendientes' }"
        @click="filtroTab = 'pendientes'"
      >
        <el-icon><Warning /></el-icon>
        Por valorar
        <span class="tab-count">{{ sesionesPendientes.length }}</span>
      </button>
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': filtroTab === 'valoradas' }"
        @click="filtroTab = 'valoradas'"
      >
        <el-icon><CircleCheck /></el-icon>
        Ya valoradas
        <span class="tab-count">{{ sesionesValoradas.length }}</span>
      </button>
    </div>

    <!-- ══ LOADING ═══════════════════════════════════════════════════════ -->
    <div v-if="loadingSesiones || loadingValoraciones" class="lista">
      <el-card v-for="i in 3" :key="i" shadow="never" class="sesion-card">
        <el-skeleton :rows="3" animated />
      </el-card>
    </div>

    <!-- ══ ESTADO VACÍO ══════════════════════════════════════════════════ -->
    <div
      v-else-if="listaMostrada.length === 0"
      class="empty-state"
    >
      <el-empty :image-size="120">
        <template #description>
          <p class="empty-title">
            {{
              filtroTab === 'pendientes'
                ? 'No tienes sesiones pendientes de valorar'
                : 'Aún no has valorado ninguna sesión'
            }}
          </p>
          <p class="empty-subtitle">
            {{
              filtroTab === 'pendientes'
                ? 'Cuando completes una sesión podrás calificarla aquí.'
                : 'Tus valoraciones enviadas aparecerán en esta sección.'
            }}
          </p>
        </template>
      </el-empty>
    </div>

    <!-- ══ LISTA ═════════════════════════════════════════════════════════ -->
    <div v-else class="lista">

      <!-- ── Tarjeta: sesión POR VALORAR ──────────────────────────────── -->
      <template v-if="filtroTab === 'pendientes'">
        <el-card
          v-for="sesion in sesionesPendientes"
          :key="sesion.id"
          shadow="never"
          class="sesion-card sesion-card--pendiente"
        >
          <div class="sesion-card__body">

            <el-avatar :size="48" class="sesion-avatar">
              {{ getLetra(sesion.mentor_id) }}
            </el-avatar>

            <div class="sesion-info">
              <p class="sesion-mentor">{{ getNombreMentor(sesion.mentor_id) }}</p>
              <p v-if="getCarreraMentor(sesion.mentor_id)" class="sesion-carrera">
                {{ getCarreraMentor(sesion.mentor_id) }}
              </p>
              <div class="sesion-meta">
                <span>{{ formatFecha(sesion.fecha) }}</span>
                <span class="meta-sep">·</span>
                <span>{{ formatHora(sesion.hora_inicio) }} – {{ formatHora(sesion.hora_fin) }}</span>
              </div>
            </div>

            <div class="sesion-accion">
              <el-tag type="warning" effect="light" size="small">Sin valorar</el-tag>
              <el-button
                type="primary"
                :icon="StarFilled"
                size="small"
                class="btn-valorar"
                @click="abrirValorar(sesion)"
              >
                Valorar sesión
              </el-button>
            </div>

          </div>
        </el-card>
      </template>

      <!-- ── Tarjeta: sesión YA VALORADA ──────────────────────────────── -->
      <template v-else>
        <el-card
          v-for="sesion in sesionesValoradas"
          :key="sesion.id"
          shadow="never"
          class="sesion-card sesion-card--valorada"
        >
          <div class="sesion-card__body">

            <el-avatar :size="48" class="sesion-avatar sesion-avatar--valorada">
              {{ getLetra(sesion.mentor_id) }}
            </el-avatar>

            <div class="sesion-info">
              <p class="sesion-mentor">{{ getNombreMentor(sesion.mentor_id) }}</p>
              <p v-if="getCarreraMentor(sesion.mentor_id)" class="sesion-carrera">
                {{ getCarreraMentor(sesion.mentor_id) }}
              </p>
              <div class="sesion-meta">
                <span>{{ formatFecha(sesion.fecha) }}</span>
                <span class="meta-sep">·</span>
                <span>{{ formatHora(sesion.hora_inicio) }} – {{ formatHora(sesion.hora_fin) }}</span>
              </div>
            </div>

            <div class="valoracion-resultado">
              <el-rate
                :model-value="valoracionesMap[sesion.id]?.calificacion"
                disabled
                :colors="['#f7ba2a', '#f7ba2a', '#ff9900']"
              />
              <span class="valoracion-label">
                {{ ratingLabels[valoracionesMap[sesion.id]?.calificacion] }}
              </span>
              <p
                v-if="valoracionesMap[sesion.id]?.comentario"
                class="valoracion-comentario"
              >
                <el-icon><ChatDotSquare /></el-icon>
                {{ valoracionesMap[sesion.id].comentario }}
              </p>
            </div>

          </div>
        </el-card>
      </template>

    </div>

    <!-- ══ DIÁLOGO DE VALORACIÓN ══════════════════════════════════════════ -->
    <el-dialog
      v-model="dialogVisible"
      title="Valorar sesión de mentoría"
      width="500px"
      align-center
      :close-on-click-modal="false"
      destroy-on-close
    >
      <!-- Info de la sesión -->
      <div v-if="sesionSeleccionada" class="dialog-sesion-info">
        <el-avatar :size="44" class="sesion-avatar">
          {{ getLetra(sesionSeleccionada.mentor_id) }}
        </el-avatar>
        <div>
          <p class="dialog-mentor-nombre">{{ getNombreMentor(sesionSeleccionada.mentor_id) }}</p>
          <p class="dialog-sesion-meta">
            {{ formatFecha(sesionSeleccionada.fecha) }}
            · {{ formatHora(sesionSeleccionada.hora_inicio) }} – {{ formatHora(sesionSeleccionada.hora_fin) }}
          </p>
        </div>
      </div>

      <el-divider />

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">

        <!-- Calificación con estrellas -->
        <el-form-item prop="calificacion">
          <template #label>
            <span class="rating-form-label">
              Calificación
              <span
                v-if="form.calificacion"
                class="rating-badge"
                :style="{ background: colorCalificacion }"
              >
                {{ labelCalificacion }}
              </span>
            </span>
          </template>

          <div class="rating-wrapper">
            <el-rate
              v-model="form.calificacion"
              :colors="['#f56c6c', '#e6a23c', '#e6a23c', '#67c23a', '#409eff']"
              :icons="[StarFilled, StarFilled, StarFilled, StarFilled, StarFilled]"
              void-color="#dcdfe6"
              size="large"
            />
            <div class="rating-scale">
              <span>Muy malo</span>
              <span>Excelente</span>
            </div>
          </div>
        </el-form-item>

        <!-- Comentario -->
        <el-form-item label="Comentario (opcional)" prop="comentario">
          <el-input
            v-model="form.comentario"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="Cuéntanos cómo fue tu experiencia con este mentor. ¿Qué aprendiste? ¿Qué mejoraría?"
            resize="none"
          />
        </el-form-item>

        <!-- Indicador visual del nivel elegido -->
        <Transition name="fade">
          <div v-if="form.calificacion" class="nivel-indicador" :style="{ borderColor: colorCalificacion }">
            <el-icon :style="{ color: colorCalificacion }"><StarFilled /></el-icon>
            <span :style="{ color: colorCalificacion }">
              <strong>{{ form.calificacion }} / 5</strong> — {{ labelCalificacion }}
            </span>
          </div>
        </Transition>

      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false" :disabled="guardando">
          Cancelar
        </el-button>
        <el-button
          type="primary"
          :loading="guardando"
          :icon="StarFilled"
          :disabled="!form.calificacion"
          @click="enviarValoracion"
        >
          Enviar valoración
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<style scoped>
/* ── Página ──────────────────────────────────────────────────────────── */
.valoraciones-page {
  padding: 1.5rem 2rem;
  max-width: 860px;
  margin: 0 auto;
}

/* ── Cabecera ────────────────────────────────────────────────────────── */
.valoraciones-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.valoraciones-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: var(--el-text-color-primary);
}

.valoraciones-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
}

/* ── Resumen ─────────────────────────────────────────────────────────── */
.valoraciones-resumen {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
}

.resumen-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.resumen-num {
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1;
}

.resumen-num--warning { color: var(--el-color-warning); }
.resumen-num--success { color: var(--el-color-success); }

.resumen-label {
  font-size: 0.72rem;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.resumen-divider {
  width: 1px;
  height: 36px;
  background: var(--el-border-color);
}

/* ── Tabs ────────────────────────────────────────────────────────────── */
.tabs-filtro {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 1.25rem;
  border-bottom: 2px solid var(--el-border-color-lighter);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
}

.tab-btn:hover { color: var(--el-color-primary); }

.tab-btn--active {
  color: var(--el-color-primary);
  font-weight: 600;
  border-bottom-color: var(--el-color-primary);
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: var(--el-fill-color);
  font-size: 0.72rem;
  font-weight: 700;
}

.tab-btn--active .tab-count {
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
}

/* ── Lista ───────────────────────────────────────────────────────────── */
.lista {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

/* ── Tarjeta de sesión ───────────────────────────────────────────────── */
.sesion-card {
  border-radius: 12px !important;
  transition: box-shadow 0.15s;
}

.sesion-card--pendiente {
  border-left: 3px solid var(--el-color-warning) !important;
}

.sesion-card--valorada {
  border-left: 3px solid var(--el-color-success) !important;
}

.sesion-card__body {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.sesion-avatar {
  flex-shrink: 0;
  background-color: var(--el-color-primary);
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
}

.sesion-avatar--valorada {
  background-color: var(--el-color-success);
}

.sesion-info {
  flex: 1;
  min-width: 0;
}

.sesion-mentor {
  margin: 0 0 0.1rem;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--el-text-color-primary);
}

.sesion-carrera {
  margin: 0 0 0.25rem;
  font-size: 0.78rem;
  color: var(--el-text-color-secondary);
}

.sesion-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

.meta-sep { opacity: 0.4; }

/* ── Acción (pendiente) ──────────────────────────────────────────────── */
.sesion-accion {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.btn-valorar { min-width: 130px; }

/* ── Resultado valoración ────────────────────────────────────────────── */
.valoracion-resultado {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
  min-width: 160px;
}

.valoracion-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--el-color-warning-dark-2);
}

.valoracion-comentario {
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;
  margin: 0;
  font-size: 0.78rem;
  color: var(--el-text-color-secondary);
  font-style: italic;
  max-width: 220px;
  text-align: right;
  line-height: 1.4;
}

/* ── Empty ───────────────────────────────────────────────────────────── */
.empty-state {
  padding: 3rem 1rem;
}

.empty-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.4rem;
  color: var(--el-text-color-primary);
}

.empty-subtitle {
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
  margin: 0;
  max-width: 340px;
  margin-inline: auto;
  line-height: 1.5;
}

/* ── Diálogo: info sesión ────────────────────────────────────────────── */
.dialog-sesion-info {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  padding: 0.875rem 1rem;
  margin-bottom: 0.25rem;
}

.dialog-mentor-nombre {
  margin: 0 0 0.15rem;
  font-weight: 700;
  font-size: 1rem;
  color: var(--el-text-color-primary);
}

.dialog-sesion-meta {
  margin: 0;
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

/* ── Rating en formulario ────────────────────────────────────────────── */
.rating-form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.rating-badge {
  display: inline-block;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  transition: background 0.3s;
}

.rating-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.rating-scale {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--el-text-color-placeholder);
  padding: 0 2px;
}

/* ── Indicador de nivel ──────────────────────────────────────────────── */
.nivel-indicador {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.875rem;
  border-radius: 8px;
  border: 1.5px solid;
  background: var(--el-fill-color-lighter);
  font-size: 0.875rem;
  transition: border-color 0.3s;
  margin-top: 0.25rem;
}

/* ── Transición fade ─────────────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.25s, transform 0.25s; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; transform: translateY(-4px); }

@media (max-width: 600px) {
  .valoraciones-page { padding: 1rem; }
  .sesion-card__body { flex-direction: column; align-items: flex-start; }
  .sesion-accion,
  .valoracion-resultado { align-items: flex-start; }
}
</style>

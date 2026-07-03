<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Calendar, Clock, Plus, WarningFilled,
  CircleCheck, CircleClose, Tickets, Edit, InfoFilled, Checked, Finished, Link, View
} from '@element-plus/icons-vue'
import { ROL } from '@/utils/roles'

const route  = useRoute()
const router = useRouter()
const user   = JSON.parse(localStorage.getItem('user') || '{}')

const esMentor   = computed(() => user.rol === ROL.MENTOR)
const esEstudiante = computed(() => user.rol === ROL.APRENDIZ)

// ── Estado ─────────────────────────────────────────────────────────────
const loadingSesiones      = ref(false)
const loadingMentores      = ref(false)
const guardando            = ref(false)
const confirmando          = ref(false)
const sesiones             = ref([])
const mentores             = ref([])
const mentoresMap          = ref({})
const filtroEstado         = ref('todas')
const dialogVisible        = ref(false)
const dialogConfirmarVisible = ref(false)
const sesionParaConfirmar  = ref(null)
const linkMeetInput        = ref('')
const formRef              = ref(null)
const dialogCancelarVisible = ref(false)
const sesionParaCancelar   = ref(null)
const motivoCancelacion    = ref('')
const cancelando           = ref(false)
const dialogDetalleVisible = ref(false)
const sesionDetalle        = ref(null)

// ── Paginación ─────────────────────────────────────────────────────────
const paginaActual = ref(1)
const totalSesiones = ref(0)
const porPagina     = ref(10)
const contadores = reactive({ todas: 0, pendiente: 0, confirmada: 0, completada: 0, cancelada: 0 })

// ── Formulario ─────────────────────────────────────────────────────────
const form = reactive({
  mentor_id:     null,
  fecha:         '',
  hora_inicio:   '',
  hora_fin:      '',
  observaciones: ''
})

// ── Opciones ───────────────────────────────────────────────────────────
const tabsFiltro = [
  { label: 'Todas',      value: 'todas'      },
  { label: 'Pendiente',  value: 'pendiente'  },
  { label: 'Confirmada', value: 'confirmada' },
  { label: 'Completada', value: 'completada' },
  { label: 'Cancelada',  value: 'cancelada'  },
]

// ── Reglas de validación ───────────────────────────────────────────────
const rules = {
  mentor_id: [
    { required: true, message: 'Selecciona un mentor', trigger: 'change' }
  ],
  fecha: [
    { required: true, message: 'Selecciona la fecha de la sesión', trigger: 'change' }
  ],
  hora_inicio: [
    { required: true, message: 'Indica la hora de inicio', trigger: 'change' }
  ],
  hora_fin: [
    { required: true, message: 'Indica la hora de fin', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (form.hora_inicio && value && value <= form.hora_inicio) {
          callback(new Error('La hora de fin debe ser posterior al inicio'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
}

// ── Computed ───────────────────────────────────────────────────────────
const fechaMinima = computed(() => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return hoy
})

// ── Cargar datos ───────────────────────────────────────────────────────
async function cargarSesiones() {
  loadingSesiones.value = true
  try {
    const { data } = await api.get('/sesiones', {
      params: {
        page:   paginaActual.value,
        estado: filtroEstado.value !== 'todas' ? filtroEstado.value : undefined
      }
    })
    sesiones.value      = Array.isArray(data.data) ? data.data : []
    totalSesiones.value = data.total ?? 0
    porPagina.value     = data.per_page ?? porPagina.value
    Object.assign(contadores, data.contadores || {})

    // Si la página quedó vacía tras cancelar/completar el último ítem, retrocede una página
    if (sesiones.value.length === 0 && paginaActual.value > 1 && totalSesiones.value > 0) {
      paginaActual.value--
      await cargarSesiones()
    }
  } catch {
    ElMessage.error('Error al cargar las sesiones')
  } finally {
    loadingSesiones.value = false
  }
}

function cambiarFiltro(valor) {
  filtroEstado.value = valor
  paginaActual.value = 1
  cargarSesiones()
}

function cambiarPagina(pagina) {
  paginaActual.value = pagina
  cargarSesiones()
}

async function cargarMentores() {
  loadingMentores.value = true
  try {
    const { data } = await api.get('/perfiles', {
      params: { ordenar_por: 'carrera', orden: 'asc' }
    })
    const lista = data.data || []
    mentores.value = lista
    lista.forEach(m => {
      mentoresMap.value[m.usuario_id] = {
        nombre:   m.usuario?.nombre  || `Mentor #${m.usuario_id}`,
        carrera:  m.carrera          || '',
        foto_url: m.foto_url         || ''
      }
    })
  } catch {
    // No crítico
  } finally {
    loadingMentores.value = false
  }
}

// ── Abrir diálogo ──────────────────────────────────────────────────────
function abrirDialogo() {
  form.mentor_id     = null
  form.fecha         = ''
  form.hora_inicio   = ''
  form.hora_fin      = ''
  form.observaciones = ''
  formRef.value?.resetFields()

  // Si viene de BuscarMentores con ?mentor_id=X
  const param = route.query.mentor_id
  if (param) {
    form.mentor_id = Number(param)
    // Limpiar el query param sin recargar
    router.replace({ query: {} })
  }

  dialogVisible.value = true
}

// ── Guardar sesión ─────────────────────────────────────────────────────
async function guardarSesion() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  guardando.value = true
  try {
    await api.post('/sesiones', {
      mentor_id:     form.mentor_id,
      aprendiz_id:   user.id,
      fecha:         form.fecha,
      hora_inicio:   form.hora_inicio,
      hora_fin:      form.hora_fin,
      observaciones: form.observaciones || null
    })

    ElMessage.success('¡Sesión agendada correctamente!')
    dialogVisible.value = false
    cargarSesiones()
  } catch (err) {
    if (err.response?.status === 409) {
      const desde = formatHora(form.hora_inicio)
      const hasta = formatHora(form.hora_fin)
      ElMessage.error(`El mentor no está disponible de ${desde} a ${hasta}. Elige otro horario.`)
    } else if (err.response?.data?.errores) {
      const msg = Object.values(err.response.data.errores)[0]?.[0]
      ElMessage.error(msg || 'Error de validación')
    } else {
      ElMessage.error(err.response?.data?.mensaje || 'No se pudo agendar la sesión')
    }
  } finally {
    guardando.value = false
  }
}

// ── Cancelar sesión ────────────────────────────────────────────────────
function abrirDialogoCancelar(sesion) {
  sesionParaCancelar.value = sesion
  motivoCancelacion.value  = ''
  dialogCancelarVisible.value = true
}

async function enviarCancelacion() {
  const motivo = motivoCancelacion.value.trim()
  if (!motivo) {
    ElMessage.warning('Debes indicar el motivo de la cancelación')
    return
  }

  cancelando.value = true
  try {
    await api.put(`/sesiones/${sesionParaCancelar.value.id}/cancelar`, { motivo })
    ElMessage.success('Sesión cancelada')
    dialogCancelarVisible.value = false
    cargarSesiones()
  } catch (err) {
    ElMessage.error(err.response?.data?.mensaje || 'No se pudo cancelar la sesión')
  } finally {
    cancelando.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────────────
function formatFecha(fecha) {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

function formatHora(hora) {
  if (!hora) return ''
  return hora.substring(0, 5)
}

function getNombreMentor(mentor_id) {
  return mentoresMap.value[mentor_id]?.nombre || `Mentor #${mentor_id}`
}

function getCarreraMentor(mentor_id) {
  return mentoresMap.value[mentor_id]?.carrera || ''
}

function getLetraMentor(mentor_id) {
  return getNombreMentor(mentor_id).charAt(0).toUpperCase()
}

function getTagType(estado) {
  return { pendiente: 'warning', confirmada: 'primary', completada: 'success', cancelada: 'info' }[estado] || 'info'
}

function getTagIcon(estado) {
  return { pendiente: WarningFilled, confirmada: CircleCheck, completada: Tickets, cancelada: CircleClose }[estado]
}

function puedeCancel(sesion) {
  return ['pendiente', 'confirmada'].includes(sesion.estado) &&
    (sesion.aprendiz_id === user.id || sesion.mentor_id === user.id)
}

function puedeConfirmar(sesion) {
  return sesion.estado === 'pendiente' && sesion.mentor_id === user.id
}

function puedeCompletar(sesion) {
  return sesion.estado === 'confirmada' && sesion.mentor_id === user.id
}

function esMiSesionComoMentor(sesion) {
  return sesion.mentor_id === user.id
}

function abrirDetalle(sesion) {
  sesionDetalle.value = sesion
  dialogDetalleVisible.value = true
}

function estadoLabel(estado) {
  return estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : ''
}

async function completarSesion(sesion) {
  try {
    await ElMessageBox.confirm(
      `¿Confirmas que la sesión del ${formatFecha(sesion.fecha)} a las ${formatHora(sesion.hora_inicio)} ya se realizó?`,
      'Marcar como completada',
      {
        confirmButtonText: 'Sí, completar',
        cancelButtonText: 'No',
        type: 'success',
      }
    )
  } catch {
    return
  }

  try {
    await api.put(`/sesiones/${sesion.id}/completar`)
    ElMessage.success('Sesión marcada como completada — el aprendiz ya puede valorarla')
    cargarSesiones()
  } catch (err) {
    ElMessage.error(err.response?.data?.mensaje || 'No se pudo completar la sesión')
  }
}

function abrirDialogoConfirmar(sesion) {
  sesionParaConfirmar.value = sesion
  linkMeetInput.value       = ''
  dialogConfirmarVisible.value = true
}

async function enviarConfirmacion() {
  const url = linkMeetInput.value.trim()
  if (!url) {
    ElMessage.warning('Debes pegar el link de Google Meet antes de confirmar')
    return
  }
  try {
    new URL(url)
  } catch {
    ElMessage.error('El link ingresado no es una URL válida')
    return
  }

  confirmando.value = true
  try {
    await api.put(`/sesiones/${sesionParaConfirmar.value.id}/confirmar`, { link_meet: url })
    ElMessage.success('Sesión confirmada — se enviaron los recordatorios por email')
    dialogConfirmarVisible.value = false
    cargarSesiones()
  } catch (err) {
    ElMessage.error(err.response?.data?.mensaje || 'No se pudo confirmar la sesión')
  } finally {
    confirmando.value = false
  }
}

onMounted(async () => {
  await Promise.all([cargarSesiones(), cargarMentores()])
  // Abrir diálogo automáticamente si viene con mentor_id
  if (route.query.mentor_id) {
    abrirDialogo()
  }
})
</script>

<template>
  <div class="sesiones-page">

    <!-- ══ CABECERA ══════════════════════════════════════════════════════ -->
    <div class="sesiones-header">
      <div>
        <h1 class="sesiones-title">
          <el-icon><Calendar /></el-icon>
          {{ esMentor ? 'Solicitudes de Mentoría' : 'Mis Sesiones' }}
        </h1>
        <p class="sesiones-subtitle">
          {{ esMentor
            ? 'Gestiona las solicitudes de sesión que recibes de los aprendices'
            : 'Gestiona tus sesiones de mentoría agendadas' }}
        </p>
      </div>

      <el-button v-if="esEstudiante" type="primary" :icon="Plus" size="large" @click="abrirDialogo">
        Agendar sesión
      </el-button>
    </div>

    <!-- ══ TABS DE FILTRO ════════════════════════════════════════════════ -->
    <div class="tabs-filtro">
      <button
        v-for="tab in tabsFiltro"
        :key="tab.value"
        class="tab-btn"
        :class="{ 'tab-btn--active': filtroEstado === tab.value }"
        @click="cambiarFiltro(tab.value)"
      >
        {{ tab.label }}
        <span class="tab-count">{{ contadores[tab.value] }}</span>
      </button>
    </div>

    <!-- ══ LOADING ═══════════════════════════════════════════════════════ -->
    <div v-if="loadingSesiones" class="sesiones-lista">
      <el-card v-for="i in 3" :key="i" shadow="never" class="sesion-card">
        <el-skeleton :rows="3" animated />
      </el-card>
    </div>

    <!-- ══ ESTADO VACÍO ══════════════════════════════════════════════════ -->
    <div v-else-if="sesiones.length === 0" class="empty-state">
      <el-empty :image-size="120">
        <template #description>
          <p class="empty-title">
            {{ esMentor
              ? (filtroEstado === 'todas' ? 'No tienes solicitudes aún' : `Sin solicitudes ${filtroEstado}s`)
              : (filtroEstado === 'todas' ? 'No tienes sesiones aún' : `Sin sesiones ${filtroEstado}s`) }}
          </p>
          <p class="empty-subtitle">
            {{ esMentor
              ? 'Los aprendices podrán encontrarte en Buscar Mentores y enviarte solicitudes.'
              : (filtroEstado === 'todas' ? 'Agenda tu primera sesión con un mentor.' : 'Cambia el filtro o agenda una nueva sesión.') }}
          </p>
        </template>
        <el-button v-if="esEstudiante" type="primary" :icon="Plus" @click="abrirDialogo">
          Agendar sesión
        </el-button>
      </el-empty>
    </div>

    <!-- ══ LISTA DE SESIONES ═════════════════════════════════════════════ -->
    <div v-else class="sesiones-lista">
      <el-card
        v-for="sesion in sesiones"
        :key="sesion.id"
        shadow="never"
        class="sesion-card"
      >
        <div class="sesion-card__body">

          <!-- Columna fecha/hora -->
          <div class="sesion-fecha-col">
            <div class="sesion-fecha">
              <el-icon><Calendar /></el-icon>
              {{ formatFecha(sesion.fecha) }}
            </div>
            <div class="sesion-hora">
              <el-icon><Clock /></el-icon>
              {{ formatHora(sesion.hora_inicio) }} – {{ formatHora(sesion.hora_fin) }}
            </div>
          </div>

          <!-- Columna mentor -->
          <div class="sesion-mentor-col">
            <el-avatar :size="40" class="sesion-avatar">
              {{ getLetraMentor(sesion.mentor_id) }}
            </el-avatar>
            <div class="sesion-mentor-info">
              <p class="sesion-mentor-nombre">
                {{ getNombreMentor(sesion.mentor_id) }}
                <el-tag v-if="esMiSesionComoMentor(sesion)" size="small" type="primary" effect="plain">
                  Tú (mentor)
                </el-tag>
              </p>
              <p v-if="getCarreraMentor(sesion.mentor_id)" class="sesion-mentor-carrera">
                {{ getCarreraMentor(sesion.mentor_id) }}
              </p>
            </div>
          </div>

          <!-- Estado y observaciones -->
          <div class="sesion-estado-col">
            <el-tag
              :type="getTagType(sesion.estado)"
              :icon="getTagIcon(sesion.estado)"
              size="default"
              effect="light"
              class="sesion-estado-tag"
            >
              {{ sesion.estado.charAt(0).toUpperCase() + sesion.estado.slice(1) }}
            </el-tag>
            <el-tooltip
              v-if="sesion.google_calendar_event_id || sesion.google_calendar_event_id_mentor"
              content="Evento sincronizado con Google Calendar"
              placement="top"
            >
              <span class="gcal-badge">
                <img
                  src="https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_16_2x.png"
                  alt="Google Calendar"
                  width="14"
                  height="14"
                />
                Google Calendar
              </span>
            </el-tooltip>
            <p v-if="sesion.observaciones" class="sesion-obs">
              {{ sesion.observaciones }}
            </p>
            <p v-if="sesion.estado === 'cancelada' && sesion.motivo_cancelacion" class="sesion-motivo">
              Motivo: {{ sesion.motivo_cancelacion }}
            </p>
            <a
              v-if="sesion.link_meet && sesion.estado === 'confirmada'"
              :href="sesion.link_meet"
              target="_blank"
              rel="noopener"
              class="meet-link"
            >
              <el-icon style="font-size:13px;"><Link /></el-icon>
              Unirse al Meet
            </a>
          </div>

          <!-- Acciones -->
          <div class="sesion-acciones">

            <el-tooltip content="Ver detalle de la sesión" placement="top">
              <el-button
                plain
                size="small"
                :icon="View"
                @click="abrirDetalle(sesion)"
              >
                Detalle
              </el-button>
            </el-tooltip>

            <el-tooltip
              v-if="puedeCompletar(sesion)"
              content="Marcar sesión como realizada"
              placement="top"
            >
              <el-button
                type="primary"
                size="small"
                :icon="Finished"
                @click="completarSesion(sesion)"
              >
                Completar
              </el-button>
            </el-tooltip>

            <el-tooltip
              v-if="puedeConfirmar(sesion)"
              content="Confirmar esta solicitud"
              placement="top"
            >
              <el-button
                type="success"
                size="small"
                :icon="CircleCheck"
                @click="abrirDialogoConfirmar(sesion)"
              >
                Confirmar
              </el-button>
            </el-tooltip>

            <el-tooltip
              v-if="puedeCancel(sesion)"
              content="Cancelar sesión"
              placement="top"
            >
              <el-button
                type="danger"
                plain
                size="small"
                :icon="CircleClose"
                @click="abrirDialogoCancelar(sesion)"
              >
                Cancelar
              </el-button>
            </el-tooltip>

          </div>

        </div>
      </el-card>
    </div>

    <!-- ══ PAGINACIÓN ════════════════════════════════════════════════════ -->
    <div v-if="!loadingSesiones && totalSesiones > porPagina" class="sesiones-paginacion">
      <el-pagination
        layout="prev, pager, next"
        :current-page="paginaActual"
        :page-size="porPagina"
        :total="totalSesiones"
        @current-change="cambiarPagina"
      />
    </div>

    <!-- ══ DIÁLOGO: CONFIRMAR SESIÓN (MENTOR) ══════════════════════════════ -->
    <el-dialog
      v-model="dialogConfirmarVisible"
      title="Confirmar sesión de mentoría"
      width="480px"
      align-center
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-if="sesionParaConfirmar">
        <p class="confirmar-info">
          Estás a punto de confirmar la sesión del
          <strong>{{ formatFecha(sesionParaConfirmar.fecha) }}</strong>
          a las <strong>{{ formatHora(sesionParaConfirmar.hora_inicio) }} – {{ formatHora(sesionParaConfirmar.hora_fin) }}</strong>.
        </p>
        <p class="confirmar-info">
          Para confirmar, pega el link de Google Meet que usarán durante la sesión.
          Se enviará automáticamente al aprendiz y a ti por correo.
        </p>
        <el-form label-position="top" style="margin-top:16px;">
          <el-form-item label="Link de Google Meet">
            <el-input
              v-model="linkMeetInput"
              :prefix-icon="Link"
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              clearable
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogConfirmarVisible = false" :disabled="confirmando">
          Cancelar
        </el-button>
        <el-button
          type="success"
          :loading="confirmando"
          :icon="CircleCheck"
          @click="enviarConfirmacion"
        >
          Confirmar sesión
        </el-button>
      </template>
    </el-dialog>

    <!-- ══ DIÁLOGO: CANCELAR SESIÓN ═════════════════════════════════════════ -->
    <el-dialog
      v-model="dialogCancelarVisible"
      title="Cancelar sesión"
      width="480px"
      align-center
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-if="sesionParaCancelar">
        <p class="confirmar-info">
          Estás a punto de cancelar la sesión del
          <strong>{{ formatFecha(sesionParaCancelar.fecha) }}</strong>
          a las <strong>{{ formatHora(sesionParaCancelar.hora_inicio) }} – {{ formatHora(sesionParaCancelar.hora_fin) }}</strong>.
        </p>
        <p class="confirmar-info">
          Indica el motivo de la cancelación. Se enviará por correo a ambas partes.
        </p>
        <el-form label-position="top" style="margin-top:16px;">
          <el-form-item label="Motivo de cancelación">
            <el-input
              v-model="motivoCancelacion"
              type="textarea"
              :rows="3"
              maxlength="500"
              show-word-limit
              placeholder="Ej: Surgió un imprevisto y no podré asistir a la sesión..."
              resize="none"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogCancelarVisible = false" :disabled="cancelando">
          Volver
        </el-button>
        <el-button
          type="danger"
          :loading="cancelando"
          :icon="CircleClose"
          @click="enviarCancelacion"
        >
          Cancelar sesión
        </el-button>
      </template>
    </el-dialog>

    <!-- ══ MODAL: DETALLE DE LA SESIÓN ══════════════════════════════════════ -->
    <el-dialog
      v-model="dialogDetalleVisible"
      title="Detalle de la sesión"
      width="520px"
      align-center
      destroy-on-close
    >
      <div v-if="sesionDetalle" class="detalle-contenido">

        <!-- Estado + ID -->
        <div class="detalle-top">
          <el-tag
            :type="getTagType(sesionDetalle.estado)"
            :icon="getTagIcon(sesionDetalle.estado)"
            effect="light"
          >
            {{ estadoLabel(sesionDetalle.estado) }}
          </el-tag>
          <span class="detalle-id">Sesión #{{ sesionDetalle.id }}</span>
        </div>

        <!-- Fecha y hora -->
        <div class="detalle-fila">
          <el-icon><Calendar /></el-icon>
          <span>{{ formatFecha(sesionDetalle.fecha) }}</span>
          <el-icon class="ml-1"><Clock /></el-icon>
          <span>{{ formatHora(sesionDetalle.hora_inicio) }} – {{ formatHora(sesionDetalle.hora_fin) }}</span>
        </div>

        <el-divider />

        <!-- Mentor -->
        <div class="detalle-seccion">
          <p class="detalle-seccion__label">Mentor</p>
          <div class="detalle-mentor">
            <el-avatar :size="36" class="sesion-avatar">
              {{ getLetraMentor(sesionDetalle.mentor_id) }}
            </el-avatar>
            <div>
              <p class="detalle-mentor__nombre">
                {{ getNombreMentor(sesionDetalle.mentor_id) }}
                <el-tag v-if="esMiSesionComoMentor(sesionDetalle)" size="small" type="primary" effect="plain">
                  Tú (mentor)
                </el-tag>
              </p>
              <p v-if="getCarreraMentor(sesionDetalle.mentor_id)" class="detalle-mentor__carrera">
                {{ getCarreraMentor(sesionDetalle.mentor_id) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Observaciones -->
        <div v-if="sesionDetalle.observaciones" class="detalle-seccion">
          <p class="detalle-seccion__label">Observaciones</p>
          <p class="detalle-texto">{{ sesionDetalle.observaciones }}</p>
        </div>

        <!-- Link de Meet -->
        <div v-if="sesionDetalle.link_meet" class="detalle-seccion">
          <p class="detalle-seccion__label">Link de la sesión</p>
          <a :href="sesionDetalle.link_meet" target="_blank" rel="noopener" class="meet-link">
            <el-icon style="font-size:13px;"><Link /></el-icon>
            {{ sesionDetalle.link_meet }}
          </a>
        </div>

        <!-- Motivo de cancelación -->
        <div v-if="sesionDetalle.estado === 'cancelada' && sesionDetalle.motivo_cancelacion" class="detalle-seccion">
          <p class="detalle-seccion__label">Motivo de cancelación</p>
          <p class="detalle-texto detalle-texto--danger">{{ sesionDetalle.motivo_cancelacion }}</p>
        </div>

        <!-- Google Calendar -->
        <div
          v-if="sesionDetalle.google_calendar_event_id || sesionDetalle.google_calendar_event_id_mentor"
          class="detalle-seccion"
        >
          <p class="detalle-seccion__label">Google Calendar</p>
          <span class="gcal-badge">
            <img
              src="https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_16_2x.png"
              alt="Google Calendar"
              width="14"
              height="14"
            />
            Evento sincronizado
          </span>
        </div>

      </div>
      <template #footer>
        <el-button @click="dialogDetalleVisible = false">Cerrar</el-button>
      </template>
    </el-dialog>

    <!-- ══ DIÁLOGO: AGENDAR SESIÓN ════════════════════════════════════════ -->
    <el-dialog
      v-model="dialogVisible"
      title="Agendar sesión de mentoría"
      width="540px"
      align-center
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
      >

        <!-- Mentor -->
        <el-form-item label="Mentor" prop="mentor_id">
          <el-select
            v-model="form.mentor_id"
            placeholder="Selecciona un mentor"
            filterable
            class="w-full"
            :loading="loadingMentores"
          >
            <el-option
              v-for="m in mentores"
              :key="m.usuario_id"
              :value="m.usuario_id"
              :label="m.usuario?.nombre"
            >
              <div class="mentor-option">
                <span class="mentor-option__nombre">{{ m.usuario?.nombre }}</span>
                <span class="mentor-option__carrera">{{ m.carrera }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- Fecha -->
        <el-form-item label="Fecha de la sesión" prop="fecha">
          <el-date-picker
            v-model="form.fecha"
            type="date"
            placeholder="Selecciona una fecha"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            :disabled-date="(d) => d < fechaMinima"
            class="w-full"
          />
        </el-form-item>

        <!-- Horario -->
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="Hora de inicio" prop="hora_inicio">
              <el-time-picker
                v-model="form.hora_inicio"
                placeholder="08:00"
                format="HH:mm"
                value-format="HH:mm:ss"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Hora de fin" prop="hora_fin">
              <el-time-picker
                v-model="form.hora_fin"
                placeholder="09:00"
                format="HH:mm"
                value-format="HH:mm:ss"
                class="w-full"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Observaciones -->
        <el-form-item label="Observaciones" prop="observaciones">
          <el-input
            v-model="form.observaciones"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="Ej: Necesito ayuda con estructuras de datos y algoritmos de ordenamiento..."
            resize="none"
          />
        </el-form-item>

        <!-- Alerta de conflicto -->
        <el-alert
          type="info"
          :icon="InfoFilled"
          :closable="false"
          show-icon
        >
          El sistema verificará automáticamente que el mentor esté disponible en el horario elegido.
        </el-alert>

      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false" :disabled="guardando">
          Cancelar
        </el-button>
        <el-button
          type="primary"
          :loading="guardando"
          :icon="Calendar"
          @click="guardarSesion"
        >
          Agendar sesión
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<style scoped>
/* ── Página ──────────────────────────────────────────────────────────── */
.sesiones-page {
  padding: 1.5rem 2rem;
  max-width: 900px;
  margin: 0 auto;
}

/* ── Cabecera ────────────────────────────────────────────────────────── */
.sesiones-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.sesiones-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: var(--el-text-color-primary);
}

.sesiones-subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
}

/* ── Tabs ────────────────────────────────────────────────────────────── */
.tabs-filtro {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
  border-bottom: 2px solid var(--el-border-color-lighter);
  padding-bottom: 0;
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
  border-radius: 0;
}

.tab-btn:hover {
  color: var(--el-color-primary);
}

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

/* ── Lista de sesiones ───────────────────────────────────────────────── */
.sesiones-lista {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

/* ── Paginación ──────────────────────────────────────────────────────── */
.sesiones-paginacion {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

/* ── Tarjeta de sesión ───────────────────────────────────────────────── */
.sesion-card {
  border-radius: 12px !important;
  transition: box-shadow 0.15s;
}

.sesion-card__body {
  display: grid;
  grid-template-columns: 150px 1fr auto auto;
  gap: 1rem;
  align-items: center;
}

@media (max-width: 700px) {
  .sesion-card__body {
    grid-template-columns: 1fr;
  }
}

/* ── Fecha/Hora ──────────────────────────────────────────────────────── */
.sesion-fecha-col {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.sesion-fecha,
.sesion-hora {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
  color: var(--el-text-color-primary);
}

.sesion-hora {
  color: var(--el-text-color-secondary);
  font-size: 0.82rem;
}

/* ── Mentor ──────────────────────────────────────────────────────────── */
.sesion-mentor-col {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.sesion-avatar {
  flex-shrink: 0;
  background-color: var(--el-color-primary);
  color: #fff;
  font-weight: 700;
}

.sesion-mentor-info {
  min-width: 0;
}

.sesion-mentor-nombre {
  margin: 0 0 0.1rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.sesion-mentor-carrera {
  margin: 0;
  font-size: 0.78rem;
  color: var(--el-text-color-secondary);
}

/* ── Estado ──────────────────────────────────────────────────────────── */
.sesion-estado-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}

.sesion-estado-tag {
  white-space: nowrap;
}

.sesion-obs {
  margin: 0;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sesion-motivo {
  margin: 0;
  font-size: 0.75rem;
  color: var(--el-color-danger);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Acciones ────────────────────────────────────────────────────────── */
.sesion-acciones {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: flex-end;
}

/* ── Empty ───────────────────────────────────────────────────────────── */
.empty-state {
  padding: 3rem 1rem;
  text-align: center;
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
  margin: 0 0 1.25rem;
}

/* ── Formulario ──────────────────────────────────────────────────────── */
.w-full { width: 100%; }

.field-hint {
  font-size: 0.75rem;
  color: var(--el-text-color-placeholder);
  margin-top: 0.25rem;
}

/* ── Opción de mentor en select ──────────────────────────────────────── */
.mentor-option {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  padding: 2px 0;
}

.mentor-option__nombre {
  font-size: 0.875rem;
  color: var(--el-text-color-primary);
}

.mentor-option__carrera {
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
}

/* ── Meet link ───────────────────────────────────────────────────────── */
.meet-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #1a73e8;
  background: #e8f0fe;
  border-radius: 6px;
  padding: 0.2rem 0.5rem;
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;
}

.meet-link:hover {
  background: #d2e3fc;
}

/* ── Confirmar diálogo ───────────────────────────────────────────────── */
.confirmar-info {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

/* ── Google Calendar badge ───────────────────────────────────────────── */
.gcal-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: #1a73e8;
  background: #e8f0fe;
  border-radius: 6px;
  padding: 0.2rem 0.5rem;
  font-weight: 600;
  white-space: nowrap;
}

/* ── Modal detalle ───────────────────────────────────────────────────── */
.detalle-contenido {
  padding: 0 0.25rem;
}

.detalle-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.875rem;
}

.detalle-id {
  font-size: 0.78rem;
  color: var(--el-text-color-placeholder);
}

.detalle-fila {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: var(--el-text-color-primary);
}

.ml-1 {
  margin-left: 0.75rem;
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

.detalle-mentor {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detalle-mentor__nombre {
  margin: 0 0 0.1rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.detalle-mentor__carrera {
  margin: 0;
  font-size: 0.78rem;
  color: var(--el-text-color-secondary);
}

.detalle-texto {
  margin: 0;
  font-size: 0.875rem;
  color: var(--el-text-color-regular);
  line-height: 1.55;
  white-space: pre-line;
}

.detalle-texto--danger {
  color: var(--el-color-danger);
}

@media (max-width: 500px) {
  .sesiones-page { padding: 1rem; }
}
</style>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import api from '@/services/axios'
import { ElMessage } from 'element-plus'
import {
  UserFilled, Edit, Picture, Reading,
  Timer, StarFilled, Check
} from '@element-plus/icons-vue'
import { ROL } from '@/utils/roles'

const user = JSON.parse(localStorage.getItem('user') || '{}')
const esEstudiante = user.rol === ROL.APRENDIZ

const formRef = ref(null)
const loading = ref(false)
const loadingPerfil = ref(true)
const tienePerfilExistente = ref(false)
const avatarError = ref(false)

// ── Opciones de ciclo ──────────────────────────────────────────────────
const ciclosOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `Ciclo ${i + 1}`,
  value: i + 1
}))

// ── Opciones de disponibilidad ─────────────────────────────────────────
const disponibilidadOpciones = [
  'Mañana (8:00 - 12:00)',
  'Tarde (12:00 - 18:00)',
  'Noche (18:00 - 22:00)',
  'Fines de semana'
]

// ── Sugerencias de habilidades ─────────────────────────────────────────
const habilidadesSugeridas = [
  'JavaScript', 'TypeScript', 'Vue.js', 'React', 'Angular',
  'Node.js', 'Laravel', 'PHP', 'Python', 'Java',
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB',
  'Docker', 'Git', 'AWS', 'Linux',
  'Diseño UI/UX', 'Figma', 'Machine Learning'
]

// ── Formulario reactivo ────────────────────────────────────────────────
const form = reactive({
  bio: '',
  carrera: '',
  ciclo: null,
  habilidades: [],
  disponibilidad: [],
  foto_url: ''
})

// ── Reglas de validación ───────────────────────────────────────────────
const rules = {
  carrera: [
    { required: true, message: 'La carrera es obligatoria', trigger: 'blur' },
    { min: 3, max: 100, message: 'Entre 3 y 100 caracteres', trigger: 'blur' }
  ],
  ciclo: [
    { required: true, message: 'Selecciona tu ciclo', trigger: 'change' }
  ],
  bio: [
    { required: true, message: 'La descripción profesional es obligatoria', trigger: 'blur' },
    { min: 10, message: 'Mínimo 10 caracteres', trigger: 'blur' },
    { max: 500, message: 'Máximo 500 caracteres', trigger: 'blur' }
  ],
  foto_url: [
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        try { new URL(value); callback() }
        catch { callback(new Error('Ingresa una URL válida (ej: https://...)')) }
      },
      trigger: 'blur'
    }
  ]
}

// ── Helpers ────────────────────────────────────────────────────────────
const bioContador = computed(() => `${form.bio.length} / 500`)
const bioColor = computed(() => {
  if (form.bio.length > 480) return 'var(--el-color-danger)'
  if (form.bio.length > 400) return 'var(--el-color-warning)'
  return 'var(--el-text-color-secondary)'
})

const avatarSrc = computed(() => form.foto_url && !avatarError.value ? form.foto_url : '')
const avatarLetra = computed(() => user.nombre?.charAt(0)?.toUpperCase() || 'U')

const rolLabel = computed(() => ({ 1: 'Estudiante', 2: 'Mentor', 3: 'Administrador' }[user.rol] || 'Usuario')
)

watch(() => form.foto_url, () => { avatarError.value = false })

// ── Cargar perfil existente ────────────────────────────────────────────
onMounted(async () => {
  try {
    const { data } = await api.get(`/perfiles/${user.id}`)
    tienePerfilExistente.value = true

    form.bio = data.bio ?? ''
    form.carrera = data.carrera ?? ''
    form.ciclo = data.ciclo ?? null
    form.foto_url = data.foto_url ?? ''
    form.habilidades = data.habilidades
      ? data.habilidades.split(',').map(h => h.trim()).filter(Boolean)
      : []
    form.disponibilidad = data.disponibilidad
      ? data.disponibilidad.split(',').map(d => d.trim()).filter(Boolean)
      : []
  } catch (err) {
    if (err.response?.status !== 404) {
      ElMessage.error('Error al cargar tu perfil')
    }
  } finally {
    loadingPerfil.value = false
  }
})

// ── Guardar perfil ─────────────────────────────────────────────────────
async function guardar() {
  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('Corrige los campos marcados antes de continuar')
    return
  }

  loading.value = true

  const payload = {
    bio: form.bio,
    carrera: form.carrera,
    ciclo: form.ciclo,
    habilidades: form.habilidades.length ? form.habilidades.join(', ') : null,
    disponibilidad: form.disponibilidad.length ? form.disponibilidad.join(', ') : null,
    foto_url: form.foto_url || null
  }

  try {
    if (tienePerfilExistente.value) {
      await api.put(`/perfiles/${user.id}`, payload)
      ElMessage({ type: 'success', message: 'Perfil actualizado correctamente', duration: 2500 })
    } else {
      await api.post('/perfiles', { usuario_id: user.id, ...payload })
      tienePerfilExistente.value = true
      ElMessage({ type: 'success', message: 'Perfil creado correctamente', duration: 2500 })
    }
  } catch (err) {
    const errores = err.response?.data?.errores
    if (errores) {
      const primero = Object.values(errores)[0]?.[0]
      ElMessage.error(primero || 'Error de validación')
    } else {
      ElMessage.error(err.response?.data?.mensaje || 'No se pudo guardar el perfil')
    }
  } finally {
    loading.value = false
  }
}

function limpiarFormulario() {
  formRef.value?.resetFields()
  form.habilidades = []
  form.disponibilidad = []
}
</script>

<template>
  <div class="perfil-page">

    <!-- ── Cabecera de página ───────────────────────────────────────── -->
    <div class="perfil-page__header">
      <div>
        <h1 class="perfil-page__title">
          <el-icon>
            <UserFilled />
          </el-icon>
          Mi Perfil
        </h1>
        <p class="perfil-page__subtitle">
          {{ tienePerfilExistente ? 'Actualiza tu información profesional' : 'Completa tu perfil para comenzar' }}
        </p>
      </div>
      <el-tag v-if="tienePerfilExistente" type="success" size="large" :icon="Check">
        Perfil activo
      </el-tag>
      <el-tag v-else type="warning" size="large">
        Perfil incompleto
      </el-tag>
    </div>

    <!-- ── Skeleton mientras carga ─────────────────────────────────── -->
    <div v-if="loadingPerfil" class="perfil-skeleton">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- ── Formulario principal ─────────────────────────────────────── -->
    <el-form v-else ref="formRef" :model="form" :rules="rules" label-position="top" class="perfil-form"
      @submit.prevent="guardar">
      <div class="perfil-grid">

        <!-- ══ COLUMNA IZQUIERDA ══════════════════════════════════════ -->
        <div class="perfil-col perfil-col--left">

          <!-- ── Avatar y foto ─────────────────────────────────────── -->
          <el-card shadow="never" class="perfil-card">
            <template #header>
              <div class="card-header">
                <el-icon>
                  <Picture />
                </el-icon>
                <span>Foto de perfil</span>
              </div>
            </template>

            <div class="avatar-section">
              <el-avatar :size="100" :src="avatarSrc" class="avatar-preview" @error="() => { avatarError = true }">
                {{ avatarLetra }}
              </el-avatar>

              <div class="avatar-info">
                <p class="avatar-name">{{ user.nombre }}</p>
                <p class="avatar-email">{{ user.email }}</p>
                <el-tag size="small" type="primary">{{ rolLabel }}</el-tag>
              </div>
            </div>

            <el-form-item label="URL de foto de perfil" prop="foto_url" class="mt-4">
              <el-input v-model="form.foto_url" placeholder="https://ejemplo.com/mi-foto.jpg" clearable disabled
                :prefix-icon="Picture" />
            </el-form-item>
          </el-card>

          <!-- ── Disponibilidad (solo mentores) ──────────────────── -->
          <el-card v-if="!esEstudiante" shadow="never" class="perfil-card">
            <template #header>
              <div class="card-header">
                <el-icon>
                  <Timer />
                </el-icon>
                <span>Disponibilidad</span>
              </div>
            </template>

            <el-form-item prop="disponibilidad">
              <el-checkbox-group v-model="form.disponibilidad" class="disponibilidad-group">
                <el-checkbox v-for="op in disponibilidadOpciones" :key="op" :value="op" class="disponibilidad-item">
                  {{ op }}
                </el-checkbox>
              </el-checkbox-group>
              <div class="field-hint">
                {{ esEstudiante ? 'Selecciona los horarios en que puedes recibir mentoría' : 'Selecciona los horarios en que puedes mentorear' }}
              </div>
            </el-form-item>
          </el-card>

        </div>

        <!-- ══ COLUMNA DERECHA ══════════════════════════════════════ -->
        <div class="perfil-col perfil-col--right">

          <!-- ── Información académica ─────────────────────────────── -->
          <el-card shadow="never" class="perfil-card">
            <template #header>
              <div class="card-header">
                <el-icon>
                  <Reading />
                </el-icon>
                <span>Información académica</span>
              </div>
            </template>

            <el-row :gutter="16">
              <el-col :xs="24" :sm="14">
                <el-form-item label="Carrera / Especialización" prop="carrera">
                  <el-input v-model="form.carrera" placeholder="Ej: Ingeniería de Sistemas" maxlength="100"
                    show-word-limit clearable />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="10">
                <el-form-item label="Ciclo / Semestre" prop="ciclo">
                  <el-select v-model="form.ciclo" placeholder="Selecciona tu ciclo" class="w-full">
                    <el-option v-for="c in ciclosOptions" :key="c.value" :label="c.label" :value="c.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-card>

          <!-- ── Descripción profesional ───────────────────────────── -->
          <el-card shadow="never" class="perfil-card">
            <template #header>
              <div class="card-header">
                <el-icon>
                  <Edit />
                </el-icon>
                <span>Descripción profesional</span>
              </div>
            </template>

            <el-form-item
              :label="esEstudiante ? '¿Qué quieres aprender? ¿Cuáles son tus metas?' : 'Cuéntanos sobre ti, tu experiencia y objetivos'"
              prop="bio"
            >
              <el-input v-model="form.bio" type="textarea" :rows="5" :maxlength="500"
                :placeholder="esEstudiante
                  ? 'Ej: Soy estudiante de 3er ciclo y quiero aprender desarrollo web. Me interesa mejorar en Vue.js y bases de datos. Busco un mentor que me guíe en proyectos reales...'
                  : 'Ej: Estudiante de 5to ciclo con experiencia en proyectos universitarios con Vue.js y Laravel. Puedo ayudarte a mejorar en arquitectura de software...'"
                resize="none" />
              <div class="bio-counter" :style="{ color: bioColor }">
                {{ bioContador }}
              </div>
              <div class="field-hint">
                {{ esEstudiante ? 'Describe tus objetivos de aprendizaje y qué esperas de tu mentor' : 'Incluye tu experiencia, logros y en qué puedes ayudar a otros' }}
              </div>
            </el-form-item>
          </el-card>

          <!-- ── Especialidades / Habilidades ──────────────────────── -->
          <el-card shadow="never" class="perfil-card">
            <template #header>
              <div class="card-header">
                <el-icon>
                  <StarFilled />
                </el-icon>
                <span>{{ esEstudiante ? 'Áreas de interés' : 'Especialidades y habilidades' }}</span>
              </div>
            </template>

            <el-form-item :label="esEstudiante ? 'Agrega las tecnologías o temas que te interesan aprender' : 'Agrega tus tecnologías y áreas de conocimiento'" prop="habilidades">
              <el-select v-model="form.habilidades" multiple filterable allow-create default-first-option
                placeholder="Escribe o selecciona una habilidad y presiona Enter" class="w-full">
                <el-option v-for="h in habilidadesSugeridas" :key="h" :label="h" :value="h" />
              </el-select>
              <div class="field-hint">
                Puedes escribir una habilidad personalizada y presionar Enter para agregarla
              </div>
            </el-form-item>

            <!-- Preview de tags guardados -->
            <div v-if="form.habilidades.length" class="habilidades-preview">
              <el-tag v-for="h in form.habilidades" :key="h" type="primary" size="small" effect="light">
                {{ h }}
              </el-tag>
            </div>
          </el-card>

        </div>
      </div>

      <!-- ── Barra de acciones ────────────────────────────────────────── -->
      <div class="perfil-actions">
        <el-button size="large" @click="limpiarFormulario" :disabled="loading">
          Limpiar
        </el-button>
        <el-button type="primary" size="large" native-type="submit" :loading="loading"
          :icon="tienePerfilExistente ? Edit : Check" @click="guardar">
          {{ tienePerfilExistente ? 'Actualizar perfil' : 'Crear perfil' }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
/* ── Página ──────────────────────────────────────────────────────────── */
.perfil-page {
  padding: 1.5rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.perfil-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.perfil-page__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: var(--el-text-color-primary);
}

.perfil-page__subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
}

/* ── Skeleton ────────────────────────────────────────────────────────── */
.perfil-skeleton {
  padding: 1rem;
}

/* ── Grid de columnas ────────────────────────────────────────────────── */
.perfil-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 860px) {
  .perfil-grid {
    grid-template-columns: 1fr;
  }
}

.perfil-col {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Cards ───────────────────────────────────────────────────────────── */
.perfil-card {
  border-radius: 12px !important;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--el-text-color-primary);
}

/* ── Avatar ──────────────────────────────────────────────────────────── */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.avatar-preview {
  flex-shrink: 0;
  font-size: 2rem;
  font-weight: 700;
  background-color: var(--el-color-primary);
  color: #fff;
}

.avatar-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.avatar-name {
  margin: 0;
  font-weight: 600;
  font-size: 1rem;
  color: var(--el-text-color-primary);
}

.avatar-email {
  margin: 0;
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

/* ── Disponibilidad ──────────────────────────────────────────────────── */
.disponibilidad-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.disponibilidad-item {
  margin-left: 0 !important;
}

/* ── Bio counter ─────────────────────────────────────────────────────── */
.bio-counter {
  text-align: right;
  font-size: 0.78rem;
  margin-top: 0.25rem;
  transition: color 0.2s;
}

/* ── Preview habilidades ─────────────────────────────────────────────── */
.habilidades-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* ── Hints ───────────────────────────────────────────────────────────── */
.field-hint {
  font-size: 0.75rem;
  color: var(--el-text-color-placeholder);
  margin-top: 0.25rem;
  line-height: 1.4;
}

.mt-4 {
  margin-top: 1rem;
}

/* ── Acciones ────────────────────────────────────────────────────────── */
.perfil-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 500px) {
  .perfil-page {
    padding: 1rem;
  }

  .perfil-actions {
    flex-direction: column-reverse;
  }

  .perfil-actions .el-button {
    width: 100%;
  }
}
</style>

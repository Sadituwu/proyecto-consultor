<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Search, Refresh, Edit, SwitchButton, Plus, Collection } from '@element-plus/icons-vue'
import api from '@/services/axios'

const router = useRouter()
const goBack = () => router.back()

// ── Estado ─────────────────────────────────────────────────────────────
const loading       = ref(false)
const guardando     = ref(false)
const areas         = ref([])
const busqueda       = ref('')
const dialogVisible  = ref(false)
const modoEdicion    = ref(false)
const formRef        = ref(null)

const form = reactive({ id: null, nombre: '', estado: 'activo' })

const estadoOpciones = [
  { label: 'Activo',   value: 'activo'   },
  { label: 'Inactivo', value: 'inactivo' },
]

const rules = {
  nombre: [
    { required: true, message: 'Ingresa el nombre del área', trigger: 'blur' },
    { max: 100, message: 'Máximo 100 caracteres', trigger: 'blur' },
  ],
  estado: [{ required: true, message: 'Selecciona un estado', trigger: 'change' }],
}

// ── Filtro de búsqueda ─────────────────────────────────────────────────
const areasFiltradas = computed(() => {
  const q = busqueda.value.toLowerCase().trim()
  if (!q) return areas.value
  return areas.value.filter(a => a.nombre.toLowerCase().includes(q))
})

// ── Cargar áreas ───────────────────────────────────────────────────────
async function cargarAreas() {
  loading.value = true
  try {
    const { data } = await api.get('/areas-interes')
    areas.value = Array.isArray(data) ? data : []
  } catch {
    ElMessage.error('Error al cargar las áreas de interés')
  } finally {
    loading.value = false
  }
}

// ── Abrir diálogo ──────────────────────────────────────────────────────
function abrirCrear() {
  modoEdicion.value = false
  form.id     = null
  form.nombre = ''
  form.estado = 'activo'
  formRef.value?.resetFields()
  dialogVisible.value = true
}

function abrirEdicion(row) {
  modoEdicion.value = true
  form.id     = row.id
  form.nombre = row.nombre
  form.estado = row.estado
  dialogVisible.value = true
}

// ── Guardar ────────────────────────────────────────────────────────────
async function guardar() {
  try { await formRef.value.validate() } catch { return }

  guardando.value = true
  try {
    if (modoEdicion.value) {
      await api.put(`/areas-interes/${form.id}`, { nombre: form.nombre, estado: form.estado })
      ElMessage.success('Área de interés actualizada')
    } else {
      await api.post('/areas-interes', { nombre: form.nombre })
      ElMessage.success('Área de interés creada')
    }
    dialogVisible.value = false
    cargarAreas()
  } catch (err) {
    if (err.response?.data?.errores) {
      const msg = Object.values(err.response.data.errores)[0]?.[0]
      ElMessage.error(msg || 'Error de validación')
    } else {
      ElMessage.error(err.response?.data?.mensaje || 'No se pudo guardar el área de interés')
    }
  } finally {
    guardando.value = false
  }
}

// ── Activar / desactivar ───────────────────────────────────────────────
async function alternarEstado(row) {
  const nuevoEstado = row.estado === 'activo' ? 'inactivo' : 'activo'
  try {
    await api.put(`/areas-interes/${row.id}`, { estado: nuevoEstado })
    ElMessage.success(`Área ${nuevoEstado === 'activo' ? 'activada' : 'desactivada'}`)
    cargarAreas()
  } catch {
    ElMessage.error('No se pudo actualizar el estado')
  }
}

onMounted(cargarAreas)
</script>

<template>
  <div class="page">
    <el-card shadow="never" class="card">

      <!-- ══ CABECERA ════════════════════════════════════════════════════ -->
      <template #header>
        <div class="flex justify-between items-center">
          <el-page-header title="Volver" :icon="ArrowLeft" @back="goBack">
            <template #content>
              <span class="text-large font-600 mr-3">Áreas de Interés</span>
              <el-tag type="info" size="small">{{ areas.length }} registros</el-tag>
            </template>
          </el-page-header>

          <div class="acciones-header">
            <el-input
              v-model="busqueda"
              placeholder="Buscar área..."
              :prefix-icon="Search"
              clearable
              style="width: 220px"
            />
            <el-button :icon="Refresh" :loading="loading" @click="cargarAreas" />
            <el-button type="primary" :icon="Plus" @click="abrirCrear">
              Nueva área
            </el-button>
          </div>
        </div>
      </template>

      <!-- ══ TABLA ══════════════════════════════════════════════════════ -->
      <el-table
        :data="areasFiltradas"
        v-loading="loading"
        style="width: 100%"
        stripe
        row-key="id"
      >
        <el-table-column prop="id" label="ID" width="60" align="center" />

        <el-table-column label="Área de interés" min-width="200">
          <template #default="{ row }">
            <div class="area-cell">
              <el-icon class="area-icon"><Collection /></el-icon>
              <span class="area-nombre">{{ row.nombre }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Estado" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.estado === 'activo' ? 'success' : 'danger'" effect="light" size="small">
              {{ row.estado === 'activo' ? 'Activo' : 'Inactivo' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Acciones" width="160" align="center">
          <template #default="{ row }">
            <el-tooltip content="Editar" placement="top">
              <el-button
                size="small"
                type="primary"
                plain
                :icon="Edit"
                @click="abrirEdicion(row)"
              />
            </el-tooltip>
            <el-tooltip
              :content="row.estado === 'activo' ? 'Desactivar' : 'Activar'"
              placement="top"
            >
              <el-button
                size="small"
                :type="row.estado === 'activo' ? 'danger' : 'success'"
                plain
                :icon="SwitchButton"
                @click="alternarEstado(row)"
              />
            </el-tooltip>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty :image-size="100" description="Aún no hay áreas de interés registradas" />
        </template>
      </el-table>

    </el-card>

    <!-- ══ DIÁLOGO CREAR / EDITAR ═══════════════════════════════════════ -->
    <el-dialog
      v-model="dialogVisible"
      width="420px"
      align-center
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template #header>
        <div class="flex justify-between items-center">
          <el-page-header title="Volver" :icon="ArrowLeft" @back="dialogVisible = false">
            <template #content>
              <span class="text-large font-600 mr-3">
                {{ modoEdicion ? 'Editar área de interés' : 'Nueva área de interés' }}
              </span>
            </template>
          </el-page-header>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="dialog-form"
      >
        <el-form-item label="Nombre" prop="nombre">
          <el-input v-model="form.nombre" placeholder="Ej: Inteligencia Artificial" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item v-if="modoEdicion" label="Estado" prop="estado">
          <el-select v-model="form.estado" class="w-full">
            <el-option
              v-for="op in estadoOpciones"
              :key="op.value"
              :label="op.label"
              :value="op.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false" :disabled="guardando">
          Cancelar
        </el-button>
        <el-button type="primary" :loading="guardando" @click="guardar">
          {{ modoEdicion ? 'Guardar cambios' : 'Crear área' }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<style scoped>
.page {
  padding: 1.5rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.card {
  border-radius: 14px !important;
}

.acciones-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ── Celda área ────────────────────────────────────────────────────── */
.area-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.area-icon {
  color: var(--el-color-primary);
}

.area-nombre {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--el-text-color-primary);
}

/* ── Diálogo ────────────────────────────────────────────────────────── */
.dialog-form {
  padding: 0.5rem 0;
}

.w-full { width: 100%; }

@media (max-width: 600px) {
  .page { padding: 1rem; }
  .acciones-header { flex-wrap: wrap; }
}
</style>

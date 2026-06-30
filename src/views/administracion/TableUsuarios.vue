<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Search, Refresh, Edit, SwitchButton } from '@element-plus/icons-vue'
import api from '@/services/axios'
import { ROL_LABEL } from '@/utils/roles'

const router = useRouter()
const goBack = () => router.back()

// ── Estado ─────────────────────────────────────────────────────────────
const loading     = ref(false)
const guardando   = ref(false)
const usuarios    = ref([])
const busqueda    = ref('')
const dialogVisible = ref(false)
const formRef     = ref(null)

const form = reactive({ id: null, nombre: '', email: '', rol: null, estado: '' })

// ── Opciones ───────────────────────────────────────────────────────────
const rolesOpciones = [
  { label: 'Estudiante',     value: 1 },
  { label: 'Mentor',         value: 2 },
  { label: 'Administrador',  value: 3 },
]

const estadoOpciones = [
  { label: 'Activo',   value: 'activo'   },
  { label: 'Inactivo', value: 'inactivo' },
]

const rules = {
  rol:    [{ required: true, message: 'Selecciona un rol',    trigger: 'change' }],
  estado: [{ required: true, message: 'Selecciona un estado', trigger: 'change' }],
}

// ── Filtro de búsqueda ─────────────────────────────────────────────────
const usuariosFiltrados = computed(() => {
  const q = busqueda.value.toLowerCase().trim()
  if (!q) return usuarios.value
  return usuarios.value.filter(u =>
    u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  )
})

// ── Helpers visuales ───────────────────────────────────────────────────
function rolTag(rol) {
  return { 1: 'info', 2: 'success', 3: 'danger' }[rol] || 'info'
}

function estadoTag(estado) {
  return estado === 'activo' ? 'success' : 'danger'
}

// ── Cargar usuarios ────────────────────────────────────────────────────
async function cargarUsuarios() {
  loading.value = true
  try {
    const { data } = await api.get('/usuarios')
    usuarios.value = data
  } catch {
    ElMessage.error('Error al cargar usuarios')
  } finally {
    loading.value = false
  }
}

// ── Abrir diálogo de edición ───────────────────────────────────────────
function abrirEdicion(row) {
  form.id     = row.id
  form.nombre = row.nombre
  form.email  = row.email
  form.rol    = row.rol
  form.estado = row.estado
  dialogVisible.value = true
}

// ── Guardar cambios ────────────────────────────────────────────────────
async function guardar() {
  try { await formRef.value.validate() } catch { return }

  guardando.value = true
  try {
    await api.put(`/usuarios/${form.id}`, {
      rol:    form.rol,
      estado: form.estado,
    })
    ElMessage.success('Usuario actualizado correctamente')
    dialogVisible.value = false
    cargarUsuarios()
  } catch {
    ElMessage.error('No se pudo actualizar el usuario')
  } finally {
    guardando.value = false
  }
}

// ── Desactivar usuario ─────────────────────────────────────────────────
async function desactivar(row) {
  const accion = row.estado === 'activo' ? 'desactivar' : 'activar'
  const nuevoEstado = row.estado === 'activo' ? 'inactivo' : 'activo'

  try {
    await ElMessageBox.confirm(
      `¿Seguro que deseas ${accion} a ${row.nombre}?`,
      `${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario`,
      { confirmButtonText: 'Sí', cancelButtonText: 'No', type: 'warning' }
    )
  } catch { return }

  try {
    await api.put(`/usuarios/${row.id}`, { estado: nuevoEstado })
    ElMessage.success(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`)
    cargarUsuarios()
  } catch {
    ElMessage.error('No se pudo actualizar el estado')
  }
}

onMounted(cargarUsuarios)
</script>

<template>
  <div class="page">
    <el-card shadow="never" class="card">

      <!-- ══ CABECERA ════════════════════════════════════════════════════ -->
      <template #header>
        <div class="flex justify-between items-center">
          <el-page-header title="Volver" :icon="ArrowLeft" @back="goBack">
            <template #content>
              <span class="text-large font-600 mr-3">Gestión de Usuarios</span>
              <el-tag type="info" size="small">{{ usuarios.length }} registros</el-tag>
            </template>
          </el-page-header>

          <div class="acciones-header">
            <el-input
              v-model="busqueda"
              placeholder="Buscar por nombre o email..."
              :prefix-icon="Search"
              clearable
              style="width: 260px"
            />
            <el-button :icon="Refresh" :loading="loading" @click="cargarUsuarios" />
          </div>
        </div>
      </template>

      <!-- ══ TABLA ══════════════════════════════════════════════════════ -->
      <el-table
        :data="usuariosFiltrados"
        v-loading="loading"
        style="width: 100%"
        stripe
        row-key="id"
      >
        <el-table-column prop="id" label="ID" width="60" align="center" />

        <el-table-column label="Usuario" min-width="200">
          <template #default="{ row }">
            <div class="usuario-cell">
              <el-avatar :size="36" class="usuario-avatar">
                {{ row.nombre?.charAt(0).toUpperCase() }}
              </el-avatar>
              <div>
                <p class="usuario-nombre">{{ row.nombre }}</p>
                <p class="usuario-email">{{ row.email }}</p>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Rol" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="rolTag(row.rol)" effect="light" size="small">
              {{ ROL_LABEL[row.rol] ?? `Rol ${row.rol}` }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Estado" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="estadoTag(row.estado)" effect="light" size="small">
              {{ row.estado === 'activo' ? 'Activo' : 'Inactivo' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Acciones" width="160" align="center">
          <template #default="{ row }">
            <el-tooltip content="Editar rol y estado" placement="top">
              <el-button
                size="small"
                type="primary"
                plain
                :icon="Edit"
                @click="abrirEdicion(row)"
              />
            </el-tooltip>
            <el-tooltip
              :content="row.estado === 'activo' ? 'Desactivar usuario' : 'Activar usuario'"
              placement="top"
            >
              <el-button
                size="small"
                :type="row.estado === 'activo' ? 'danger' : 'success'"
                plain
                :icon="SwitchButton"
                @click="desactivar(row)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

    </el-card>

    <!-- ══ DIÁLOGO EDICIÓN ════════════════════════════════════════════════ -->
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
              <span class="text-large font-600 mr-3">Actualizar Usuario</span>
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
        <!-- Info del usuario (solo lectura) -->
        <div class="usuario-info-box">
          <el-avatar :size="44" class="usuario-avatar">
            {{ form.nombre?.charAt(0).toUpperCase() }}
          </el-avatar>
          <div>
            <p class="usuario-nombre">{{ form.nombre }}</p>
            <p class="usuario-email">{{ form.email }}</p>
          </div>
        </div>

        <el-form-item label="Rol" prop="rol">
          <el-select v-model="form.rol" class="w-full">
            <el-option
              v-for="op in rolesOpciones"
              :key="op.value"
              :label="op.label"
              :value="op.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Estado" prop="estado">
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
          Guardar cambios
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

/* ── Celda usuario ─────────────────────────────────────────────────── */
.usuario-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.usuario-avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--el-color-primary), #9b59b6);
  color: #fff;
  font-weight: 700;
}

.usuario-nombre {
  margin: 0 0 0.1rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--el-text-color-primary);
}

.usuario-email {
  margin: 0;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
}

/* ── Diálogo ────────────────────────────────────────────────────────── */
.dialog-form {
  padding: 0.5rem 0;
}

.usuario-info-box {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  margin-bottom: 1.25rem;
}

.w-full { width: 100%; }

@media (max-width: 600px) {
  .page { padding: 1rem; }
  .acciones-header { flex-wrap: wrap; }
}
</style>

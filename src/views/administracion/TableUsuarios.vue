<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/services/axios'

const tableData = ref([])
const loading = ref(false)

const goBack = () => {
  window.history.back()
}

const getUsuarios = async () => {
  loading.value = true
  try {
    const res = await api.get('/usuarios')
    tableData.value = res.data
  } catch (error) {
    ElMessage.error('Error al cargar usuarios')
    console.log(error)
  } finally {
    loading.value = false
  }
}
const handleEdit = (row) => {
  console.log('editar', row)
}

const handleDelete = (row) => {
  console.log('eliminar', row)
}

onMounted(() => {
  getUsuarios()
})
</script>
<template>
  <div class="page">

    <el-card shadow="never" class="card">

      <div class="header">
        <el-page-header @back="goBack">
          <template #content>
            <span class="title">Listado de Usuarios</span>
          </template>
        </el-page-header>

        <div class="actions">
          <el-input placeholder="Buscar" size="small" clearable />
          <el-button size="small">🔄</el-button>
          <el-button type="primary" size="small">+ Nuevo</el-button>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="nombre" label="Nombre" />
        <el-table-column prop="email" label="Email" />
        <el-table-column prop="rol" label="Rol" width="80" />
        <el-table-column prop="estado" label="Estado" width="100" />

        <el-table-column label="Acciones" width="180">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">
              Editar
            </el-button>

            <el-button size="small" type="danger" @click="handleDelete(row)">
              Eliminar
            </el-button>
          </template>
        </el-table-column>

      </el-table>

    </el-card>

  </div>
</template>

<style scoped>
.page {
  padding: 24px;
  background: #f5f6f8;
  min-height: 100vh;
}

.card {
  border-radius: 10px;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
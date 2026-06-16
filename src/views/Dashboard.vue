<script setup>
import { computed } from 'vue'

const user = computed(() => JSON.parse(localStorage.getItem('user') || '{}'))
</script>

<template>
  <div class="dashboard-wrap">
    <el-card class="dashboard-card" shadow="never">
      <template #header>
        <div class="dashboard-header">
          <el-avatar :size="56" :src="user.avatar">
            {{ user.nombre?.charAt(0) }}
          </el-avatar>
          <div>
            <h2>Bienvenido, {{ user.nombre }}</h2>
            <p class="el-text el-text--info">{{ user.email }}</p>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-statistic title="Rol" :value="user.rol" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="Estado" :value="user.estado" />
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard-wrap {
  padding: 2rem;
}

.dashboard-card {
  max-width: 800px;
  margin: 0 auto;
  border-radius: 16px !important;
}

.dashboard-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dashboard-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
}

.dashboard-header p {
  margin: 0.2rem 0 0;
}
</style>

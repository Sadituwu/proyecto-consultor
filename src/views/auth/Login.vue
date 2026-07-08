<script setup>
import bg from '@/assets/logos-login/login-mentoria.jpg'

document.title = 'Iniciar Sesión'

function handleGoogleLogin() {
  window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-img" :style="{ backgroundImage: `url(${bg})` }">
      <div class="login-img__overlay">
        <h1>Mentores<br><span> al servicio tuyo</span></h1>
        <p>Accede a mentores 24/7.</p>
      </div>
    </div>
    <!-- Panel formulario  -->
    <div class="login-panel">
      <el-card class="login-card" shadow="never">
        <div class="login-card__header">
          <el-avatar :size="48" class="login-avatar">
            <el-icon :size="24">
              <Lock />
            </el-icon>
          </el-avatar>
          <h2 class="el-text is-bold" style="font-size: 1.4rem">Bienvenido</h2>
          <p class="el-text el-text--info" style="font-size: 0.85rem">Accede a tu cuenta</p>
        </div>
        <el-form class="login-form">
          <el-button size="large" class="btn-google" @click="handleGoogleLogin">
            <img src="@/assets/logos-login/google.png" alt="Google" class="google-icon" />
            Ingresar con Google
          </el-button>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.login-wrap {
  display: flex;
  min-height: 100vh;
}

/* ── Imagen ── */
.login-img {
  display: none;
  flex: 1;
  background: center / cover no-repeat;
  position: relative;
}

@media (min-width: 900px) {
  .login-img {
    display: block;
  }
}

.login-img__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 3rem;
  background: linear-gradient(
    to top,
    rgba(15, 23, 42, 0.85) 30%,
    transparent
  );
  color: #fff;
}

.login-img__overlay h1 {
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 0.75rem;
}

.login-img__overlay h1 span {
  color: #a5b4fc;
}

.login-img__overlay p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

/* ── Panel ── */
.login-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
}

/* ── Card ── */
.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 16px !important;
}

.login-card__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
  text-align: center;
}

.login-avatar {
  background-color: var(--el-color-primary) !important;
  color: #fff !important;
  margin-bottom: 0.5rem;
}

/* ── Form ── */
.login-form .el-form-item {
  margin-bottom: 1rem;
}

/* ── Botones ── */
.btn-login,
.btn-google {
  width: 100%;
  border-radius: 10px;
  margin-left: 0 !important;
}

.btn-login {
  margin-bottom: 12px;
}

/* ── Google ── */
.btn-google {
  border: 1px solid #dcdfe6;
  background: #fff;
  color: #606266;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  transition: all 0.2s ease;
}

.btn-google:hover {
  background: #f5f7fa;
  border-color: #c0c4cc;
}

.google-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

/* ── Registro ── */
.login-form p {
  text-align: center;
  margin-top: 1rem;
}

.el-link {
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: 600;
}

.el-link:hover {
  text-decoration: underline;
}
</style>
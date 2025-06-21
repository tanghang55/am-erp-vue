<template>
  <el-container id="app">
    <el-header>
      <h1 class="title">{{ $t('message.hello') }}</h1>
      <el-menu
        :default-active="activeMenu"
        class="main-menu"
        mode="horizontal"
        background-color="#545c64"
        text-color="#fff"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="home">
          <router-link to="/">Home</router-link>
        </el-menu-item>
        <el-menu-item index="about">
          <router-link to="/about">About</router-link>
        </el-menu-item>
        <el-menu-item index="login">
          <router-link to="/login">Login</router-link>
        </el-menu-item>
        <el-menu-item index="register">
          <router-link to="/register">Register</router-link>
        </el-menu-item>
      </el-menu>
    </el-header>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = ref('home')

// update active menu item when route changes
watch(
  () => route.path,
  (val) => {
    activeMenu.value = val.replace('/', '') || 'home'
  },
  { immediate: true }
)
</script>

<style>
#app {
  min-height: 100vh;
}
.title {
  font-size: 1.25rem;
  color: #fff;
}
.el-header {
  display: flex;
  align-items: center;
  background-color: #545c64;
  padding: 0 1rem;
}
.main-menu {
  margin-left: 2rem;
  flex: 1;
}
.el-main {
  padding: 2rem;
}
</style>

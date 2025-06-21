<template>
  <div class="login-page">
    <el-form @submit.prevent="onSubmit" :model="form" class="login-form">
      <el-form-item label="Username">
        <el-input v-model="form.username" autocomplete="off" />
      </el-form-item>
      <el-form-item label="Password">
        <el-input v-model="form.password" type="password" autocomplete="off" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit">Login</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const form = reactive({
  username: '',
  password: ''
})

const onSubmit = () => {
  console.log('login', form)
  // TODO: implement login logic
}
</script>

<style scoped>
.login-page {
  max-width: 400px;
  margin: 2rem auto;
}
</style>

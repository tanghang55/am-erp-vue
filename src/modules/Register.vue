<template>
  <div class="register-page">
    <el-form @submit.prevent="onSubmit" :model="form" class="register-form">
      <el-form-item label="Username">
        <el-input v-model="form.username" autocomplete="off" />
      </el-form-item>
      <el-form-item label="Password">
        <el-input v-model="form.password" type="password" autocomplete="off" />
      </el-form-item>
      <el-form-item label="Confirm">
        <el-input v-model="form.confirm" type="password" autocomplete="off" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit">Register</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const form = reactive({
  username: '',
  password: '',
  confirm: ''
})

const onSubmit = () => {
  console.log('register', form)
  // TODO: implement registration logic
}
</script>

<style scoped>
.register-page {
  max-width: 400px;
  margin: 2rem auto;
}
</style>

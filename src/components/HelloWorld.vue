<template>
  <div class="hello">{{ msg }}</div>
</template>

<script setup>
defineProps({
  msg: {
    type: String,
    default: 'Hello World'
  }
})
</script>

<style scoped>
.hello {
  color: #42b983;
}
</style>

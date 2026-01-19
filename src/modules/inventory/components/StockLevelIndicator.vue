<template>
  <div class="stock-level-indicator">
    <el-tooltip :content="tooltipText" placement="top">
      <div class="indicator-wrapper">
        <el-tag :type="tagType" size="small">
          {{ quantity }}
        </el-tag>
        <div class="progress-bar" :style="{ width: '60px' }">
          <div
            class="progress-fill"
            :style="{
              width: progressWidth,
              backgroundColor: progressColor
            }"
          ></div>
        </div>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

interface Props {
  quantity: number
  threshold?: {
    low: number    // 低库存阈值
    normal: number // 正常库存阈值
  }
  maxDisplay?: number // 进度条最大显示值
}

const props = withDefaults(defineProps<Props>(), {
  threshold: () => ({ low: 10, normal: 100 }),
  maxDisplay: 200
})

const localeStore = useLocaleStore()

// 库存水平类型
const stockLevel = computed(() => {
  if (props.quantity === 0) return 'zero'
  if (props.quantity < props.threshold.low) return 'low'
  if (props.quantity < props.threshold.normal) return 'medium'
  return 'high'
})

// Tag类型
const tagType = computed(() => {
  switch (stockLevel.value) {
    case 'zero':
      return 'info'
    case 'low':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'high':
      return 'success'
    default:
      return ''
  }
})

// 进度条宽度
const progressWidth = computed(() => {
  const percentage = Math.min((props.quantity / props.maxDisplay) * 100, 100)
  return `${percentage}%`
})

// 进度条颜色
const progressColor = computed(() => {
  switch (stockLevel.value) {
    case 'zero':
      return '#909399'
    case 'low':
      return '#F56C6C'
    case 'medium':
      return '#E6A23C'
    case 'high':
      return '#67C23A'
    default:
      return '#409EFF'
  }
})

// 提示文本
const tooltipText = computed(() => {
  const isEnglish = localeStore.isEnglish
  switch (stockLevel.value) {
    case 'zero':
      return isEnglish ? 'Zero stock' : '零库存'
    case 'low':
      return isEnglish
        ? `Low stock (< ${props.threshold.low})`
        : `低库存（< ${props.threshold.low}）`
    case 'medium':
      return isEnglish
        ? `Moderate stock (${props.threshold.low} - ${props.threshold.normal})`
        : `库存适中（${props.threshold.low} - ${props.threshold.normal}）`
    case 'high':
      return isEnglish
        ? `Stock sufficient (≥ ${props.threshold.normal})`
        : `库存充足（≥ ${props.threshold.normal}）`
    default:
      return ''
  }
})
</script>

<style scoped>
.stock-level-indicator {
  display: inline-block;
}

.indicator-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: 3px;
}
</style>

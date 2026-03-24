<template>
  <el-table :data="items" v-loading="loading" border stripe>
    <el-table-column label="配置项" min-width="260">
      <template #default="{ row }">
        <div class="group-cell">
          <div class="group-line">
            <span class="group-value group-title">{{ row.item_name }}</span>
          </div>
          <div class="group-line">
            <span class="group-label">编码</span>
            <span class="group-value">{{ row.item_code }}</span>
          </div>
          <div v-if="row.reference_count" class="group-line">
            <span class="group-label">引用</span>
            <span class="group-value">{{ row.reference_count }} 个产品</span>
          </div>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="状态" width="120">
      <template #default="{ row }">
        <div class="status-stack">
          <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'" size="small">{{ row.status === 'ACTIVE' ? '启用' : '停用' }}</el-tag>
          <el-tag v-if="row.deletable === false" type="warning" effect="plain" size="small">不可删除</el-tag>
          <div v-if="row.deletable === false && row.delete_block_reason" class="status-stack__remark">
            {{ row.delete_block_reason }}
          </div>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="排序" width="100" prop="sort" />
    <el-table-column label="备注" min-width="220">
      <template #default="{ row }">{{ row.remark || '-' }}</template>
    </el-table-column>
    <el-table-column label="更新时间" width="170">
      <template #default="{ row }">{{ formatDateTime(row.gmt_modified) }}</template>
    </el-table-column>
    <el-table-column label="操作" width="220" fixed="right">
      <template #default="{ row }">
        <el-button size="small" @click="$emit('view', row)">查看详情</el-button>
        <el-button size="small" type="primary" @click="$emit('edit', row)">编辑</el-button>
        <el-tooltip :disabled="row.deletable !== false" :content="row.delete_block_reason || '当前不可删除'">
          <span class="action-wrapper">
            <el-button size="small" type="danger" :disabled="row.deletable === false" @click="$emit('delete', row)">删除</el-button>
          </span>
        </el-tooltip>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import type { ProductConfigItem } from '../types'

defineProps<{
  items: ProductConfigItem[]
  loading: boolean
  formatDateTime: (value?: string) => string
}>()

defineEmits<{
  (e: 'view', row: ProductConfigItem): void
  (e: 'edit', row: ProductConfigItem): void
  (e: 'delete', row: ProductConfigItem): void
}>()
</script>

<style scoped>
.group-cell {
  display: grid;
  gap: 6px;
}

.group-line {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.group-label {
  color: #94a3b8;
  font-size: 12px;
}

.group-value {
  color: #0f172a;
  font-size: 13px;
}

.group-title {
  font-size: 14px;
  font-weight: 600;
}

.status-stack {
  display: grid;
  gap: 6px;
  justify-items: start;
}

.status-stack__remark {
  font-size: 12px;
  line-height: 1.4;
  color: #64748b;
}

.action-wrapper {
  display: inline-flex;
}
</style>

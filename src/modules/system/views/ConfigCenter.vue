<template>
  <div class="config-center-page" v-loading="pageLoading">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">{{ isEnglish ? 'Config Center' : '配置中心' }}</div>
            <div class="page-subtitle">
              {{ isEnglish ? 'Manage global business rules by module and keep configuration sources centralized.' : '按模块维护全局业务规则，统一配置来源，避免规则散落在业务页面。' }}
            </div>
          </div>
          <div class="header-actions">
            <el-input
              v-model="keyword"
              clearable
              :placeholder="isEnglish ? 'Search current module' : '搜索当前模块配置'"
              class="search-input"
            />
            <el-button @click="reloadCurrentModule">{{ isEnglish ? 'Reload' : '刷新' }}</el-button>
            <el-button type="primary" :loading="saving" :disabled="!currentModule" @click="handleSave">
              {{ isEnglish ? 'Save Current Module' : '保存当前模块' }}
            </el-button>
          </div>
        </div>
      </template>

      <div class="summary-grid">
        <div v-for="card in summaryCards" :key="card.label" class="summary-card" data-testid="config-center-summary-card">
          <div class="summary-card__label">{{ card.label }}</div>
          <div class="summary-card__value">{{ card.value }}</div>
          <div class="summary-card__hint">{{ card.hint }}</div>
        </div>
      </div>

      <div class="layout">
        <aside class="module-sidebar">
          <div class="sidebar-title">{{ isEnglish ? 'Modules' : '模块导航' }}</div>
          <el-menu :default-active="activeModuleCode" @select="handleSelectModule">
            <el-menu-item v-for="item in modules" :key="item.module_code" :index="item.module_code">
              <div class="module-option">
                <div class="module-option__name">{{ item.module_name }}</div>
                <div class="module-option__code">{{ item.module_code }}</div>
              </div>
            </el-menu-item>
          </el-menu>
        </aside>

        <section class="module-content">
          <el-empty v-if="!currentModule" :description="isEnglish ? 'No module config' : '暂无模块配置'" />
          <template v-else>
            <section class="module-overview-card">
              <div class="module-overview-card__main">
                <div class="module-overview-card__title">{{ currentModule.module_name }}</div>
                <div class="module-overview-card__meta">
                  <span>{{ isEnglish ? 'Current scope: GLOBAL' : '当前作用域：GLOBAL' }}</span>
                  <span>{{ isEnglish ? 'Items' : '配置项' }} {{ currentItemCount }}</span>
                  <span>{{ isEnglish ? 'Groups' : '分组' }} {{ currentGroupCount }}</span>
                </div>
              </div>
              <div class="module-overview-card__status" :class="{ dirty: pendingChangeCount > 0 }">
                <span>{{ isEnglish ? 'Pending Changes' : '待保存变更' }}</span>
                <strong>{{ pendingChangeCount }}</strong>
              </div>
            </section>

            <el-empty
              v-if="filteredGroups.length === 0"
              :description="isEnglish ? 'No matched config items' : '当前搜索没有命中配置项'"
            />

            <div v-else class="group-list">
              <el-card v-for="group in filteredGroups" :key="group.group_code" shadow="never" class="group-card">
                <template #header>
                  <div class="group-header">
                    <div>
                      <div class="group-header__title">{{ group.group_name }}</div>
                      <div class="group-header__hint">{{ isEnglish ? 'Module group configuration' : '模块内配置分组' }}</div>
                    </div>
                    <span class="group-count">{{ group.items.length }} {{ isEnglish ? 'items' : '项' }}</span>
                  </div>
                </template>

                <el-form label-width="140px" class="group-form">
                  <el-form-item v-for="item in group.items" :key="item.config_key" :label="item.label">
                    <div class="config-item">
                      <component
                        :is="resolveControl(item)"
                        v-model="formValues[item.config_key]"
                        v-bind="resolveControlProps(item)"
                        :disabled="isImmutableItem(item)"
                        class="config-control"
                      >
                        <el-option
                          v-for="option in item.options"
                          v-if="item.value_type === 'ENUM'"
                          :key="option"
                          :label="option"
                          :value="option"
                        />
                      </component>
                      <div class="config-meta">
                        <span v-if="item.description">{{ item.description }}</span>
                        <span>{{ isEnglish ? 'Default:' : '默认值：' }}{{ item.default_value }}</span>
                        <span>{{ item.config_key }}</span>
                      </div>
                    </div>
                  </el-form-item>
                </el-form>
              </el-card>
            </div>
          </template>
        </section>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { getConfigCenterModule, getConfigCenterModules, updateConfigCenterModule } from '../api'
import type { ConfigCenterItem, ConfigCenterModuleDetail, ConfigCenterModuleSummary } from '../types/configCenter'

const localeStore = useLocaleStore()
const route = useRoute()
const router = useRouter()

const isEnglish = computed(() => localeStore.isEnglish)
const pageLoading = ref(false)
const saving = ref(false)
const keyword = ref('')
const modules = ref<ConfigCenterModuleSummary[]>([])
const currentModule = ref<ConfigCenterModuleDetail | null>(null)
const activeModuleCode = ref('')
const formValues = reactive<Record<string, string | number>>({})
const originalValues = reactive<Record<string, string>>({})

const applyModule = (payload: ConfigCenterModuleDetail | null) => {
  currentModule.value = payload
  Object.keys(formValues).forEach((key) => delete formValues[key])
  Object.keys(originalValues).forEach((key) => delete originalValues[key])
  payload?.groups.forEach((group) => {
    group.items.forEach((item) => {
      const normalizedValue = item.value_type === 'INT' ? Number(item.value || item.default_value || 0) : item.value
      formValues[item.config_key] = normalizedValue
      originalValues[item.config_key] = String(item.value ?? '')
    })
  })
}

const fetchModules = async () => {
  const res = await getConfigCenterModules()
  modules.value = res.data || []
  const requestedModule = typeof route.query.module === 'string' ? route.query.module : ''
  const candidate = requestedModule || activeModuleCode.value
  if (candidate && modules.value.some((item) => item.module_code === candidate)) {
    activeModuleCode.value = candidate
    return
  }
  if (modules.value.length > 0) {
    activeModuleCode.value = modules.value[0].module_code
  }
}

const fetchModuleDetail = async (moduleCode: string) => {
  if (!moduleCode) {
    applyModule(null)
    return
  }
  const res = await getConfigCenterModule(moduleCode)
  applyModule(res.data)
}

const filteredGroups = computed(() => {
  const module = currentModule.value
  if (!module) return []
  const term = keyword.value.trim().toLowerCase()
  if (!term) return module.groups
  return module.groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const haystack = [item.label, item.description, item.config_key].join(' ').toLowerCase()
        return haystack.includes(term)
      })
    }))
    .filter((group) => group.items.length > 0)
})

const currentGroupCount = computed(() => currentModule.value?.groups.length || 0)
const currentItemCount = computed(() => currentModule.value?.groups.reduce((sum, group) => sum + group.items.length, 0) || 0)
const pendingChangeCount = computed(() => {
  if (!currentModule.value) return 0
  let count = 0
  currentModule.value.groups.forEach((group) => {
    group.items.forEach((item) => {
      const raw = formValues[item.config_key]
      const currentValue = item.value_type === 'INT' ? String(Number(raw ?? item.default_value ?? 0)) : String(raw ?? '').trim()
      if (currentValue !== originalValues[item.config_key]) {
        count += 1
      }
    })
  })
  return count
})

const summaryCards = computed(() => [
  {
    label: isEnglish.value ? 'Modules' : '模块数',
    value: modules.value.length,
    hint: isEnglish.value ? 'Available config modules' : '当前可维护的模块数量'
  },
  {
    label: isEnglish.value ? 'Current Groups' : '当前分组',
    value: currentGroupCount.value,
    hint: isEnglish.value ? 'Groups in current module' : '当前模块的配置分组数'
  },
  {
    label: isEnglish.value ? 'Current Items' : '当前配置项',
    value: currentItemCount.value,
    hint: isEnglish.value ? 'Items in current module' : '当前模块的配置项数量'
  },
  {
    label: isEnglish.value ? 'Pending Changes' : '待保存变更',
    value: pendingChangeCount.value,
    hint: isEnglish.value ? 'Unsaved changes in current module' : '当前模块尚未保存的配置项'
  }
])

const resolveControl = (item: ConfigCenterItem) => {
  if (item.value_type === 'ENUM') return 'el-select'
  if (item.value_type === 'INT') return 'el-input-number'
  if (item.value_type === 'BOOL') return 'el-switch'
  return 'el-input'
}

const resolveControlProps = (item: ConfigCenterItem) => {
  if (item.value_type === 'ENUM') return { style: 'width: 100%' }
  if (item.value_type === 'INT') return { min: 0, precision: 0, style: 'width: 220px' }
  if (item.value_type === 'BOOL') return { activeValue: '1', inactiveValue: '0' }
  return { placeholder: item.default_value || '', style: 'width: 320px' }
}

const isImmutableItem = (item: ConfigCenterItem) => item.config_key === 'finance.default_currency'

const handleSelectModule = async (moduleCode: string) => {
  activeModuleCode.value = moduleCode
  if (route.query.module !== moduleCode) {
    await router.replace({ name: 'system-config-center', query: { module: moduleCode } })
  }
  pageLoading.value = true
  try {
    await fetchModuleDetail(moduleCode)
  } finally {
    pageLoading.value = false
  }
}

const reloadCurrentModule = async () => {
  pageLoading.value = true
  try {
    await fetchModules()
    if (activeModuleCode.value) {
      await fetchModuleDetail(activeModuleCode.value)
    }
  } finally {
    pageLoading.value = false
  }
}

const handleSave = async () => {
  if (!currentModule.value) return
  saving.value = true
  try {
    const values: Record<string, string> = {}
    currentModule.value.groups.forEach((group) => {
      group.items.forEach((item) => {
        const raw = formValues[item.config_key]
        if (item.value_type === 'INT') {
          values[item.config_key] = String(Number(raw ?? item.default_value ?? 0))
          return
        }
        values[item.config_key] = String(raw ?? '').trim()
      })
    })
    const res = await updateConfigCenterModule(currentModule.value.module_code, { values })
    applyModule(res.data)
    ElMessage.success(isEnglish.value ? 'Module saved' : '模块配置已保存')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  pageLoading.value = true
  try {
    await fetchModules()
    if (activeModuleCode.value) {
      await fetchModuleDetail(activeModuleCode.value)
    }
  } finally {
    pageLoading.value = false
  }
})

watch(
  () => route.query.module,
  async (next) => {
    if (typeof next !== 'string' || !next || next === activeModuleCode.value) return
    if (!modules.value.some((item) => item.module_code === next)) return
    await handleSelectModule(next)
  }
)
</script>

<style scoped>
.config-center-page {
  width: 100%;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.page-subtitle {
  margin-top: 6px;
  color: #6b7280;
  line-height: 1.6;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 260px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 20px 0;
}

.summary-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.summary-card__label,
.summary-card__hint {
  color: #6b7280;
  font-size: 13px;
}

.summary-card__value {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 600;
  color: #111827;
}

.summary-card__hint {
  margin-top: 8px;
}

.layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 16px;
}

.module-sidebar {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 12px;
}

.sidebar-title {
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.module-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.module-option__name {
  color: #111827;
}

.module-option__code {
  font-size: 12px;
  color: #909399;
}

.module-overview-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
  margin-bottom: 16px;
}

.module-overview-card__title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.module-overview-card__meta {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
}

.module-overview-card__status {
  min-width: 120px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  text-align: right;
}

.module-overview-card__status.dirty {
  background: #fff7ed;
  color: #b45309;
}

.module-overview-card__status span {
  display: block;
  font-size: 12px;
}

.module-overview-card__status strong {
  display: block;
  margin-top: 6px;
  font-size: 24px;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-card {
  border-radius: 12px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.group-header__title {
  font-weight: 600;
  color: #111827;
}

.group-header__hint,
.group-count {
  color: #909399;
  font-size: 12px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.config-control {
  max-width: 360px;
}

.config-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .layout {
    grid-template-columns: 1fr;
  }
}
</style>

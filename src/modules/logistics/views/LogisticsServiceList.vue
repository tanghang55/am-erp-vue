<template>
  <div class="service-list-container">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">物流服务管理</div>
            <div class="page-subtitle">统一维护运输方式、目的地区域和服务档案，供物流报价与发货流程直接引用。</div>
          </div>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增物流服务
          </el-button>
        </div>
      </template>

      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="运输方式">
          <el-select v-model="searchForm.transport_mode" placeholder="全部" clearable style="width: 160px">
            <el-option
              v-for="(config, key) in TRANSPORT_MODE_CONFIG"
              :key="key"
              :label="config.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="(config, key) in SERVICE_STATUS_CONFIG"
              :key="key"
              :label="config.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="服务名称 / 编码 / 目的地"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column label="物流服务" min-width="280">
          <template #default="{ row }">
            <div class="service-main">
              <div class="service-main__name">{{ row.service_name }}</div>
              <div class="service-main__meta">{{ row.service_code }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="运输与目的地" min-width="240">
          <template #default="{ row }">
            <div class="transport-block">
              <div>{{ TRANSPORT_MODE_CONFIG[row.transport_mode]?.icon }} {{ TRANSPORT_MODE_CONFIG[row.transport_mode]?.label }}</div>
              <div class="transport-block__meta">{{ row.destination_region || '未限定目的地' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="服务说明" min-width="280">
          <template #default="{ row }">
            <div class="description-block">
              {{ row.description || '暂无服务说明' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <div class="status-stack">
              <el-tag :type="SERVICE_STATUS_CONFIG[row.status]?.color">
                {{ SERVICE_STATUS_CONFIG[row.status]?.label }}
              </el-tag>
              <el-tag v-if="row.deletable === false" type="warning" effect="plain" size="small">不可删除</el-tag>
              <div v-if="row.reference_count" class="transport-block__meta">{{ row.reference_count }} 处引用</div>
              <div v-else-if="row.deletable === false" class="transport-block__meta">
                {{ row.delete_block_reason || '已被业务数据引用，不可删除' }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.updated_at || row.created_at) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看详情</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-dropdown trigger="click">
              <el-button size="small">更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :disabled="row.deletable === false" @click="handleDelete(row)" class="danger-dropdown-item">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handleSearch"
          @size-change="handleSearch"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="720px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <div class="dialog-layout">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-position="top"
          class="dialog-form"
        >
          <div class="dialog-grid">
            <el-form-item label="服务代码" prop="service_code">
              <el-input v-model="formData.service_code" placeholder="如：SEA_SLOW_US、AIR_EXPRESS" clearable />
            </el-form-item>
            <el-form-item label="服务名称" prop="service_name">
              <el-input v-model="formData.service_name" placeholder="如：美国慢船、快速空运" clearable />
            </el-form-item>
            <el-form-item label="运输方式" prop="transport_mode">
              <el-select v-model="formData.transport_mode" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="(config, key) in TRANSPORT_MODE_CONFIG"
                  :key="key"
                  :label="`${config.icon} ${config.label}`"
                  :value="key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" style="width: 100%">
                <el-option
                  v-for="(config, key) in SERVICE_STATUS_CONFIG"
                  :key="key"
                  :label="config.label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="目的地站点 / 国家" class="span-full">
              <el-input v-model="formData.destination_region" placeholder="如：美国、欧洲、日本" clearable />
            </el-form-item>
            <el-form-item label="服务说明" class="span-full">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="4"
                placeholder="用于说明运输时效、区域限制、适用品类等"
              />
            </el-form-item>
          </div>
        </el-form>

        <aside class="dialog-aside">
          <div class="dialog-summary">
            <div class="dialog-summary__title">档案摘要</div>
            <div class="dialog-summary__item">
              <span>服务代码</span>
              <strong>{{ formData.service_code || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>服务名称</span>
              <strong>{{ formData.service_name || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>运输方式</span>
              <strong>{{ TRANSPORT_MODE_CONFIG[formData.transport_mode || 'SEA']?.label }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>目的地</span>
              <strong>{{ formData.destination_region || '未限定' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>状态</span>
              <strong>{{ SERVICE_STATUS_CONFIG[formData.status || 'ACTIVE']?.label }}</strong>
            </div>
          </div>
        </aside>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="物流服务详情" width="760px">
      <div v-if="currentService" class="detail-layout">
        <section class="detail-card detail-card--main">
          <div class="detail-main__title">{{ currentService.service_name }}</div>
          <div class="detail-main__meta">{{ currentService.service_code }}</div>
          <div class="detail-tags">
            <el-tag :type="SERVICE_STATUS_CONFIG[currentService.status]?.color">
              {{ SERVICE_STATUS_CONFIG[currentService.status]?.label }}
            </el-tag>
            <el-tag>
              {{ TRANSPORT_MODE_CONFIG[currentService.transport_mode]?.icon }} {{ TRANSPORT_MODE_CONFIG[currentService.transport_mode]?.label }}
            </el-tag>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">运输范围</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>运输方式</span>
              <strong>{{ TRANSPORT_MODE_CONFIG[currentService.transport_mode]?.label }}</strong>
            </div>
            <div class="detail-item">
              <span>目的地</span>
              <strong>{{ currentService.destination_region || '未限定' }}</strong>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">服务说明</div>
          <div class="detail-remark">{{ currentService.description || '暂无服务说明' }}</div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">引用状态</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>删除状态</span>
              <strong>{{ currentService.deletable === false ? currentService.delete_block_reason || '不可删除' : '可删除' }}</strong>
            </div>
            <div class="detail-item">
              <span>引用数量</span>
              <strong>{{ currentService.reference_count || 0 }}</strong>
            </div>
          </div>
        </section>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { createLogisticsService, deleteLogisticsService, getLogisticsServices, updateLogisticsService } from '../api'
import type { CreateLogisticsServiceParams, LogisticsService, LogisticsServiceListParams } from '../types'
import { SERVICE_STATUS_CONFIG, TRANSPORT_MODE_CONFIG } from '../types'
import { parsePaginatedResponse } from '@/utils/api'
import { buildCodeValidator } from '@/modules/common/utils/code'

const searchForm = reactive<LogisticsServiceListParams>({
  transport_mode: undefined,
  status: undefined,
  keyword: ''
})

const list = ref<LogisticsService[]>([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const dialogVisible = ref(false)
const detailVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const dialogTitle = computed(() => dialogMode.value === 'create' ? '新增物流服务' : '编辑物流服务')
const formRef = ref<FormInstance>()
const submitting = ref(false)
const currentService = ref<LogisticsService | null>(null)

const defaultFormData: CreateLogisticsServiceParams = {
  service_code: '',
  service_name: '',
  transport_mode: 'SEA',
  destination_region: '',
  description: '',
  status: 'ACTIVE'
}

const formData = reactive<CreateLogisticsServiceParams & { id?: number }>({ ...defaultFormData })

const validateServiceCode = buildCodeValidator('服务代码只允许字母、数字、中划线、下划线')

const formRules: FormRules = {
  service_code: [
    { required: true, message: '请输入服务代码', trigger: 'blur' },
    { validator: validateServiceCode, trigger: 'blur' }
  ],
  service_name: [{ required: true, message: '请输入服务名称', trigger: 'blur' }],
  transport_mode: [{ required: true, message: '请选择运输方式', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 16)
}

const loadList = async () => {
  loading.value = true
  try {
    const response = await getLogisticsServices({
      ...searchForm,
      page: pagination.page,
      page_size: pagination.page_size
    })
    const { items, total } = parsePaginatedResponse(response)
    list.value = items
    pagination.total = total
  } catch (error: any) {
    if (!error._handled) {
      ElMessage.error(error.message || '加载物流服务列表失败')
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadList()
}

const handleReset = () => {
  searchForm.transport_mode = undefined
  searchForm.status = undefined
  searchForm.keyword = ''
  pagination.page = 1
  loadList()
}

const handleCreate = () => {
  dialogMode.value = 'create'
  Object.assign(formData, { ...defaultFormData })
  dialogVisible.value = true
}

const handleEdit = (row: LogisticsService) => {
  dialogMode.value = 'edit'
  Object.assign(formData, {
    id: row.id,
    service_code: row.service_code,
    service_name: row.service_name,
    transport_mode: row.transport_mode,
    destination_region: row.destination_region || '',
    description: row.description || '',
    status: row.status
  })
  dialogVisible.value = true
}

const handleView = (row: LogisticsService) => {
  currentService.value = row
  detailVisible.value = true
}

const handleDelete = async (row: LogisticsService) => {
  if (row.deletable === false) {
    ElMessage.warning(row.delete_block_reason || '当前物流服务不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除物流服务“${row.service_name}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteLogisticsService(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (error: any) {
    if (error !== 'cancel' && !error._handled) {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true
    if (dialogMode.value === 'create') {
      await createLogisticsService(formData)
      ElMessage.success('创建成功')
    } else {
      await updateLogisticsService(formData.id!, formData)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (error: any) {
    if (!error._handled) {
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

loadList()
</script>

<style scoped>
.service-list-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.search-form {
  margin-bottom: 20px;
}

.service-main,
.transport-block,
.status-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.service-main__name {
  color: #111827;
  font-weight: 600;
}

.service-main__meta,
.transport-block__meta {
  font-size: 12px;
  color: #6b7280;
}

.description-block {
  color: #4b5563;
  line-height: 1.6;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-layout {
  display: grid;
  gap: 16px;
}

.detail-card {
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.detail-card--main {
  background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
}

.detail-main__title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.detail-main__meta {
  margin-top: 6px;
  color: #6b7280;
}

.detail-tags {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.detail-card__title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item span {
  font-size: 12px;
  color: #6b7280;
}

.detail-item strong,
.detail-remark {
  color: #111827;
  line-height: 1.6;
}

.danger-dropdown-item {
  color: #dc2626;
}

.dialog-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 20px;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.span-full {
  grid-column: 1 / -1;
}

.dialog-aside {
  border-left: 1px solid #e5e7eb;
  padding-left: 20px;
}

.dialog-summary {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
}

.dialog-summary__title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.dialog-summary__item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
  font-size: 13px;
}

.dialog-summary__item:last-child {
  border-bottom: none;
}

.dialog-summary__item strong {
  color: #111827;
  text-align: right;
}

@media (max-width: 960px) {
  .page-header,
  .dialog-layout {
    grid-template-columns: 1fr;
    display: grid;
  }

  .dialog-aside {
    border-left: none;
    border-top: 1px solid #e5e7eb;
    padding-left: 0;
    padding-top: 20px;
  }
}

@media (max-width: 768px) {
  .service-list-container {
    padding: 12px;
  }

  .dialog-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="provider-list-container">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">物流商管理</div>
            <div class="page-subtitle">统一维护物流商档案、服务类型、结算账号和联系信息，方便报价与头程发货统一引用。</div>
          </div>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增物流商
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="物流商类型">
          <el-select v-model="searchForm.provider_type" placeholder="全部" clearable style="width: 160px">
            <el-option
              v-for="(config, key) in PROVIDER_TYPE_CONFIG"
              :key="key"
              :label="config.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="(config, key) in PROVIDER_STATUS_CONFIG"
              :key="key"
              :label="config.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="物流商名称 / 编号"
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
        <el-table-column label="物流商" min-width="280">
          <template #default="{ row }">
            <div class="provider-main">
              <div class="provider-main__name">{{ row.provider_name }}</div>
              <div class="provider-main__meta">{{ row.provider_code }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="类型与服务" min-width="240">
          <template #default="{ row }">
            <div class="type-block">
              <el-tag :type="PROVIDER_TYPE_CONFIG[row.provider_type]?.color">
                {{ PROVIDER_TYPE_CONFIG[row.provider_type]?.label }}
              </el-tag>
              <div class="type-block__service">{{ row.service_types || '未维护服务类型' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="联系信息" min-width="240">
          <template #default="{ row }">
            <div class="contact-block">
              <div>{{ row.contact_person || '未维护联系人' }}</div>
              <div class="contact-block__meta">{{ row.contact_phone || '-' }}</div>
              <div class="contact-block__meta">{{ row.contact_email || '-' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="结算信息" min-width="220">
          <template #default="{ row }">
            <div class="account-block">
              <div>{{ row.account_number || '未维护客户账号' }}</div>
              <div class="account-block__meta">账期 {{ row.credit_days || 0 }} 天</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态与备注" min-width="220">
          <template #default="{ row }">
            <div class="status-block">
              <el-tag :type="PROVIDER_STATUS_CONFIG[row.status]?.color">
                {{ PROVIDER_STATUS_CONFIG[row.status]?.label }}
              </el-tag>
              <el-tag v-if="row.deletable === false" type="warning" effect="plain" size="small">不可删除</el-tag>
              <div v-if="row.reference_count" class="status-block__remark">{{ row.reference_count }} 处引用</div>
              <div v-else-if="row.deletable === false" class="status-block__remark">
                {{ row.delete_block_reason || '已被业务数据引用，不可删除' }}
              </div>
              <div class="status-block__remark">{{ row.remark || '暂无备注' }}</div>
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
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="760px"
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
            <el-form-item label="物流商编号" prop="provider_code">
              <el-input v-model="formData.provider_code" placeholder="请输入物流商编号" />
            </el-form-item>
            <el-form-item label="物流商名称" prop="provider_name">
              <el-input v-model="formData.provider_name" placeholder="请输入物流商名称" />
            </el-form-item>
            <el-form-item label="物流商类型" prop="provider_type">
              <el-select v-model="formData.provider_type" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="(config, key) in PROVIDER_TYPE_CONFIG"
                  :key="key"
                  :label="config.label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio label="ACTIVE">启用</el-radio>
                <el-radio label="INACTIVE">停用</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="服务类型" class="span-full">
              <el-input
                v-model="formData.service_types"
                placeholder="如：EXPRESS, AIR, SEA"
              />
            </el-form-item>
            <el-form-item label="联系人">
              <el-input v-model="formData.contact_person" placeholder="请输入联系人" />
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="formData.contact_phone" placeholder="请输入联系电话" />
            </el-form-item>
            <el-form-item label="联系邮箱" class="span-full">
              <el-input v-model="formData.contact_email" placeholder="请输入联系邮箱" />
            </el-form-item>
            <el-form-item label="地址" class="span-full">
              <el-input
                v-model="formData.address"
                type="textarea"
                :rows="3"
                placeholder="请输入地址"
              />
            </el-form-item>
            <el-form-item label="客户账号">
              <el-input v-model="formData.account_number" placeholder="请输入客户账号" />
            </el-form-item>
            <el-form-item label="账期(天)">
              <el-input-number v-model="formData.credit_days" :min="0" :max="365" />
            </el-form-item>
            <el-form-item label="备注" class="span-full">
              <el-input
                v-model="formData.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注"
              />
            </el-form-item>
          </div>
        </el-form>

        <aside class="dialog-aside">
          <div class="dialog-summary">
            <div class="dialog-summary__title">档案摘要</div>
            <div class="dialog-summary__item">
              <span>物流商编号</span>
              <strong>{{ formData.provider_code || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>物流商名称</span>
              <strong>{{ formData.provider_name || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>服务类型</span>
              <strong>{{ formatServiceTypes(formData.service_types) }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>账期</span>
              <strong>{{ formData.credit_days || 0 }} 天</strong>
            </div>
            <div class="dialog-summary__item">
              <span>状态</span>
              <strong>{{ PROVIDER_STATUS_CONFIG[formData.status || 'ACTIVE']?.label }}</strong>
            </div>
          </div>
        </aside>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="物流商详情" width="760px">
      <div v-if="currentProvider" class="detail-layout">
        <section class="detail-card detail-card--main">
          <div class="detail-main__title">{{ currentProvider.provider_name }}</div>
          <div class="detail-main__meta">{{ currentProvider.provider_code }}</div>
          <div class="detail-tags">
            <el-tag :type="PROVIDER_TYPE_CONFIG[currentProvider.provider_type]?.color">
              {{ PROVIDER_TYPE_CONFIG[currentProvider.provider_type]?.label }}
            </el-tag>
            <el-tag :type="PROVIDER_STATUS_CONFIG[currentProvider.status]?.color">
              {{ PROVIDER_STATUS_CONFIG[currentProvider.status]?.label }}
            </el-tag>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">联系信息</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>联系人</span>
              <strong>{{ currentProvider.contact_person || '-' }}</strong>
            </div>
            <div class="detail-item">
              <span>联系电话</span>
              <strong>{{ currentProvider.contact_phone || '-' }}</strong>
            </div>
            <div class="detail-item detail-item--full">
              <span>联系邮箱</span>
              <strong>{{ currentProvider.contact_email || '-' }}</strong>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">结算与服务</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>服务类型</span>
              <strong>{{ formatServiceTypes(currentProvider.service_types) }}</strong>
            </div>
            <div class="detail-item">
              <span>客户账号</span>
              <strong>{{ currentProvider.account_number || '-' }}</strong>
            </div>
            <div class="detail-item">
              <span>账期</span>
              <strong>{{ currentProvider.credit_days || 0 }} 天</strong>
            </div>
            <div class="detail-item">
              <span>删除状态</span>
              <strong>{{ currentProvider.deletable === false ? currentProvider.delete_block_reason || '不可删除' : '可删除' }}</strong>
            </div>
            <div class="detail-item">
              <span>引用数量</span>
              <strong>{{ currentProvider.reference_count || 0 }}</strong>
            </div>
            <div class="detail-item detail-item--full">
              <span>地址</span>
              <strong>{{ currentProvider.address || '未维护地址' }}</strong>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">备注信息</div>
          <div class="detail-remark">{{ currentProvider.remark || '暂无备注' }}</div>
        </section>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { createProvider, deleteProvider, getProviders, updateProvider } from '../api'
import type { CreateProviderParams, LogisticsProvider, ProviderListParams } from '../types'
import { PROVIDER_STATUS_CONFIG, PROVIDER_TYPE_CONFIG } from '../types'
import { parsePaginatedResponse } from '@/utils/api'
import { buildCodeValidator } from '@/modules/common/utils/code'

const searchForm = reactive<ProviderListParams>({
  provider_type: undefined,
  status: undefined,
  keyword: ''
})

const list = ref<LogisticsProvider[]>([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const dialogVisible = ref(false)
const detailVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const dialogTitle = computed(() => dialogMode.value === 'create' ? '新增物流商' : '编辑物流商')
const formRef = ref<FormInstance>()
const submitting = ref(false)
const currentProvider = ref<LogisticsProvider | null>(null)

const defaultFormData: CreateProviderParams = {
  provider_code: '',
  provider_name: '',
  provider_type: 'COURIER',
  service_types: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  address: '',
  account_number: '',
  credit_days: 0,
  remark: '',
  status: 'ACTIVE'
}

const formData = reactive<CreateProviderParams & { id?: number }>({ ...defaultFormData })

const validateProviderCode = buildCodeValidator('物流商编号只允许字母、数字、中划线、下划线')

const formRules: FormRules = {
  provider_code: [
    { required: true, message: '请输入物流商编号', trigger: 'blur' },
    { validator: validateProviderCode, trigger: 'blur' }
  ],
  provider_name: [{ required: true, message: '请输入物流商名称', trigger: 'blur' }],
  provider_type: [{ required: true, message: '请选择物流商类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 16)
}

const formatServiceTypes = (value?: string) => {
  return value ? value.replace(/,/g, ' / ') : '未维护'
}

const loadList = async () => {
  loading.value = true
  try {
    const response = await getProviders({
      ...searchForm,
      page: pagination.page,
      page_size: pagination.page_size
    })
    const { items, total } = parsePaginatedResponse(response)
    list.value = items
    pagination.total = total
  } catch (error: any) {
    if (!error._handled) {
      ElMessage.error(error.message || '加载物流商列表失败')
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
  searchForm.provider_type = undefined
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

const handleEdit = (row: LogisticsProvider) => {
  dialogMode.value = 'edit'
  Object.assign(formData, {
    id: row.id,
    provider_code: row.provider_code,
    provider_name: row.provider_name,
    provider_type: row.provider_type,
    service_types: row.service_types || '',
    contact_person: row.contact_person || '',
    contact_phone: row.contact_phone || '',
    contact_email: row.contact_email || '',
    address: row.address || '',
    account_number: row.account_number || '',
    credit_days: row.credit_days || 0,
    remark: row.remark || '',
    status: row.status
  })
  dialogVisible.value = true
}

const handleView = (row: LogisticsProvider) => {
  currentProvider.value = row
  detailVisible.value = true
}

const handleDelete = async (row: LogisticsProvider) => {
  if (row.deletable === false) {
    ElMessage.warning(row.delete_block_reason || '当前物流商不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除物流商“${row.provider_name}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteProvider(row.id)
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
      await createProvider(formData)
      ElMessage.success('创建成功')
    } else {
      await updateProvider(formData.id!, formData)
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
.provider-list-container {
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

.provider-main,
.contact-block,
.account-block,
.status-block,
.type-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.provider-main__name {
  color: #111827;
  font-weight: 600;
}

.provider-main__meta,
.contact-block__meta,
.account-block__meta,
.type-block__service {
  font-size: 12px;
  color: #6b7280;
}

.status-block__remark {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
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

.detail-item--full {
  grid-column: 1 / -1;
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
  .provider-list-container {
    padding: 12px;
  }

  .dialog-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>

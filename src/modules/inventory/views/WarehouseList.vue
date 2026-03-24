<template>
  <div class="warehouse-list">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">{{ labels.title }}</div>
            <div class="page-subtitle">{{ labels.subtitle }}</div>
          </div>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            {{ labels.create }}
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item :label="labels.type">
          <el-select v-model="searchForm.type" :placeholder="labels.all" clearable style="width: 160px" @clear="handleSearch">
            <el-option :label="typeLabels.OWN" value="OWN" />
            <el-option :label="typeLabels.FBA" value="FBA" />
            <el-option :label="typeLabels.THIRD_PARTY" value="THIRD_PARTY" />
          </el-select>
        </el-form-item>
        <el-form-item :label="labels.status">
          <el-select v-model="searchForm.status" :placeholder="labels.all" clearable style="width: 140px" @clear="handleSearch">
            <el-option :label="statusLabels.ACTIVE" value="ACTIVE" />
            <el-option :label="statusLabels.INACTIVE" value="INACTIVE" />
            <el-option :label="statusLabels.CLOSED" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item :label="labels.keyword">
          <el-input
            v-model="searchForm.keyword"
            :placeholder="labels.keywordPlaceholder"
            clearable
            style="width: 240px"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ labels.search }}</el-button>
          <el-button @click="handleReset">{{ labels.reset }}</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column :label="labels.warehouseInfo" min-width="280">
          <template #default="{ row }">
            <div class="warehouse-main">
              <div class="warehouse-main__name">{{ row.name }}</div>
              <div class="warehouse-main__meta">{{ row.code }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="labels.typeStatus" min-width="220">
          <template #default="{ row }">
            <div class="type-status-block">
              <el-tag :type="getTypeColor(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
              <el-tag :type="getStatusColor(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
              <el-tag v-if="row.deletable === false" type="warning" effect="plain">不可删除</el-tag>
              <div v-if="row.reference_count" class="type-status-block__meta">{{ row.reference_count }} 处引用</div>
              <div v-else-if="row.deletable === false" class="type-status-block__meta">
                {{ row.delete_block_reason || '已被业务数据引用，不可删除' }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="labels.locationInfo" min-width="260">
          <template #default="{ row }">
            <div class="location-block">
              <div class="location-block__country">{{ row.country || '-' }}</div>
              <div class="location-block__address">{{ row.address || labels.emptyAddress }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="labels.contactInfo" min-width="220">
          <template #default="{ row }">
            <div class="contact-block">
              <div>{{ row.contact_person || labels.emptyContact }}</div>
              <div class="contact-block__meta">{{ row.contact_phone || '-' }}</div>
              <div class="contact-block__meta">{{ row.contact_email || '-' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="labels.actions" width="210" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">{{ labels.viewDetail }}</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">{{ labels.edit }}</el-button>
            <el-dropdown trigger="click">
              <el-button size="small">{{ labels.more }}</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :disabled="row.deletable === false" @click="handleDelete(row)" class="danger-dropdown-item">
                    {{ labels.delete }}
                  </el-dropdown-item>
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
    >
      <div class="dialog-layout">
        <el-form
          :model="warehouseForm"
          :rules="formRules"
          ref="formRef"
          label-position="top"
          class="dialog-form"
        >
          <div class="dialog-grid">
            <el-form-item :label="labels.code" prop="code">
              <el-input v-model="warehouseForm.code" :placeholder="labels.codePlaceholder" />
            </el-form-item>
            <el-form-item :label="labels.name" prop="name">
              <el-input v-model="warehouseForm.name" :placeholder="labels.namePlaceholder" />
            </el-form-item>
            <el-form-item :label="labels.type" prop="type">
              <el-select v-model="warehouseForm.type" :placeholder="labels.select" style="width: 100%">
                <el-option :label="typeLabels.OWN" value="OWN" />
                <el-option :label="typeLabels.FBA" value="FBA" />
                <el-option :label="typeLabels.THIRD_PARTY" value="THIRD_PARTY" />
              </el-select>
            </el-form-item>
            <el-form-item :label="labels.countryCode" prop="country">
              <el-input v-model="warehouseForm.country" :placeholder="labels.countryPlaceholder" />
            </el-form-item>
            <el-form-item :label="labels.address" prop="address" class="span-full">
              <el-input
                v-model="warehouseForm.address"
                type="textarea"
                :rows="3"
                :placeholder="labels.addressPlaceholder"
              />
            </el-form-item>
            <el-form-item :label="labels.contactPerson" prop="contact_person">
              <el-input v-model="warehouseForm.contact_person" :placeholder="labels.contactPersonPlaceholder" />
            </el-form-item>
            <el-form-item :label="labels.contactPhone" prop="contact_phone">
              <el-input v-model="warehouseForm.contact_phone" :placeholder="labels.contactPhonePlaceholder" />
            </el-form-item>
            <el-form-item :label="labels.contactEmail" prop="contact_email" class="span-full">
              <el-input v-model="warehouseForm.contact_email" :placeholder="labels.contactEmailPlaceholder" />
            </el-form-item>
            <el-form-item :label="labels.status" prop="status">
              <el-radio-group v-model="warehouseForm.status">
                <el-radio label="ACTIVE">{{ statusLabels.ACTIVE }}</el-radio>
                <el-radio label="INACTIVE">{{ statusLabels.INACTIVE }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="labels.remark" prop="remark" class="span-full">
              <el-input
                v-model="warehouseForm.remark"
                type="textarea"
                :rows="2"
                :placeholder="labels.remarkPlaceholder"
              />
            </el-form-item>
          </div>
        </el-form>

        <aside class="dialog-aside">
          <div class="dialog-summary">
            <div class="dialog-summary__title">{{ labels.archiveSummary }}</div>
            <div class="dialog-summary__item">
              <span>{{ labels.code }}</span>
              <strong>{{ warehouseForm.code || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>{{ labels.name }}</span>
              <strong>{{ warehouseForm.name || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>{{ labels.type }}</span>
              <strong>{{ getTypeLabel(warehouseForm.type) }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>{{ labels.status }}</span>
              <strong>{{ getStatusLabel(warehouseForm.status) }}</strong>
            </div>
          </div>
        </aside>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ labels.cancel }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ labels.save }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" :title="labels.detailTitle" width="820px">
      <div v-if="currentWarehouse" class="detail-layout">
        <section class="detail-card detail-card--main">
          <div class="detail-main">
            <div class="detail-main__title">{{ currentWarehouse.name }}</div>
            <div class="detail-main__meta">{{ currentWarehouse.code }}</div>
            <div class="detail-tags">
              <el-tag :type="getTypeColor(currentWarehouse.type)">{{ getTypeLabel(currentWarehouse.type) }}</el-tag>
              <el-tag :type="getStatusColor(currentWarehouse.status)">{{ getStatusLabel(currentWarehouse.status) }}</el-tag>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">{{ labels.locationInfo }}</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>{{ labels.country }}</span>
              <strong>{{ currentWarehouse.country || '-' }}</strong>
            </div>
            <div class="detail-item detail-item--full">
              <span>{{ labels.address }}</span>
              <strong>{{ currentWarehouse.address || labels.emptyAddress }}</strong>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">{{ labels.contactInfo }}</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>{{ labels.contactPerson }}</span>
              <strong>{{ currentWarehouse.contact_person || labels.emptyContact }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ labels.contactPhone }}</span>
              <strong>{{ currentWarehouse.contact_phone || '-' }}</strong>
            </div>
            <div class="detail-item detail-item--full">
              <span>{{ labels.contactEmail }}</span>
              <strong>{{ currentWarehouse.contact_email || '-' }}</strong>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">{{ labels.archiveInfo }}</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>{{ labels.createdAt }}</span>
              <strong>{{ currentWarehouse.created_at || '-' }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ labels.updatedAt }}</span>
              <strong>{{ currentWarehouse.updated_at || '-' }}</strong>
            </div>
            <div class="detail-item">
              <span>删除状态</span>
              <strong>{{ currentWarehouse.deletable === false ? currentWarehouse.delete_block_reason || '不可删除' : '可删除' }}</strong>
            </div>
            <div class="detail-item">
              <span>引用数量</span>
              <strong>{{ currentWarehouse.reference_count || 0 }}</strong>
            </div>
            <div class="detail-item detail-item--full">
              <span>{{ labels.remark }}</span>
              <strong>{{ currentWarehouse.remark || '-' }}</strong>
            </div>
          </div>
        </section>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { buildCodeValidator } from '@/modules/common/utils/code'
import {
  getWarehouseList,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
} from '../api'
import type { Warehouse } from '../types'
import { WAREHOUSE_TYPE_CONFIG, WAREHOUSE_STATUS_CONFIG } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Warehouse Management',
      subtitle: 'Manage warehouse master data, location details, and contact information in one place.',
      create: 'New Warehouse',
      type: 'Warehouse Type',
      status: 'Status',
      all: 'All',
      keyword: 'Keyword',
      keywordPlaceholder: 'Warehouse code / name',
      search: 'Search',
      reset: 'Reset',
      code: 'Warehouse Code',
      name: 'Warehouse Name',
      country: 'Country',
      address: 'Address',
      contactPerson: 'Contact',
      contactPhone: 'Phone',
      contactEmail: 'Email',
      actions: 'Actions',
      view: 'View',
      viewDetail: 'View Details',
      edit: 'Edit',
      more: 'More',
      delete: 'Delete',
      select: 'Select',
      codePlaceholder: 'e.g. WH-US-001',
      namePlaceholder: 'e.g. US East Warehouse',
      countryCode: 'Country Code',
      countryPlaceholder: 'e.g. US, CN',
      addressPlaceholder: 'Enter warehouse address',
      contactPersonPlaceholder: 'Enter contact person',
      contactPhonePlaceholder: 'Enter contact phone',
      contactEmailPlaceholder: 'Enter contact email',
      remark: 'Remark',
      remarkPlaceholder: 'Enter remark',
      cancel: 'Cancel',
      save: 'Save',
      detailTitle: 'Warehouse Details',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      createTitle: 'New Warehouse',
      editTitle: 'Edit Warehouse',
      deleteConfirm: 'Delete warehouse "{name}"? You cannot delete a warehouse with inventory.',
      deleteTitle: 'Warning',
      deleteConfirmText: 'Confirm',
      deleteCancelText: 'Cancel',
      createdSuccess: 'Created',
      updatedSuccess: 'Updated',
      deletedSuccess: 'Deleted',
      loadFailed: 'Failed to load warehouse list',
      codeRequired: 'Please enter warehouse code',
      nameRequired: 'Please enter warehouse name',
      typeRequired: 'Please select warehouse type',
      warehouseInfo: 'Warehouse',
      typeStatus: 'Type & Status',
      locationInfo: 'Location',
      contactInfo: 'Contact Information',
      archiveSummary: 'Archive Summary',
      archiveInfo: 'Archive Information',
      emptyAddress: 'No address',
      emptyContact: 'No contact'
    }
  }
  return {
    title: '仓库管理',
    subtitle: '统一维护仓库档案、地址位置和联系信息，避免仓库资料散落在不同页面。',
    create: '新建仓库',
    type: '仓库类型',
    status: '状态',
    all: '全部',
    keyword: '关键词',
    keywordPlaceholder: '仓库代码 / 名称',
    search: '查询',
    reset: '重置',
    code: '仓库代码',
    name: '仓库名称',
    country: '国家',
    address: '地址',
    contactPerson: '联系人',
    contactPhone: '联系电话',
    contactEmail: '联系邮箱',
    actions: '操作',
    view: '查看',
    viewDetail: '查看详情',
    edit: '编辑',
    more: '更多',
    delete: '删除',
    select: '请选择',
    codePlaceholder: '如：WH-US-001',
    namePlaceholder: '如：美国东部仓',
    countryCode: '国家代码',
    countryPlaceholder: '如：US, CN',
    addressPlaceholder: '请输入仓库地址',
    contactPersonPlaceholder: '请输入联系人',
    contactPhonePlaceholder: '请输入联系电话',
    contactEmailPlaceholder: '请输入联系邮箱',
    remark: '备注',
    remarkPlaceholder: '请输入备注',
    cancel: '取消',
    save: '保存',
    detailTitle: '仓库详情',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    createTitle: '新建仓库',
    editTitle: '编辑仓库',
    deleteConfirm: '确定要删除仓库“{name}”吗？如果仓库有库存将无法删除。',
    deleteTitle: '提示',
    deleteConfirmText: '确定',
    deleteCancelText: '取消',
    createdSuccess: '创建成功',
    updatedSuccess: '更新成功',
    deletedSuccess: '删除成功',
    loadFailed: '加载仓库列表失败',
    codeRequired: '请输入仓库代码',
    nameRequired: '请输入仓库名称',
    typeRequired: '请选择仓库类型',
    warehouseInfo: '仓库信息',
    typeStatus: '类型与状态',
    locationInfo: '位置信息',
    contactInfo: '联系信息',
    archiveSummary: '档案摘要',
    archiveInfo: '档案信息',
    emptyAddress: '暂无地址',
    emptyContact: '暂无联系人'
  }
})

const typeLabels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      FBA: 'Amazon FBA',
      THIRD_PARTY: 'Third-Party Warehouse',
      OWN: 'Owned Warehouse'
    }
  }
  return {
    FBA: 'Amazon FBA',
    THIRD_PARTY: '第三方仓库',
    OWN: '自有仓库'
  }
})

const statusLabels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      CLOSED: 'Closed'
    }
  }
  return {
    ACTIVE: '启用',
    INACTIVE: '停用',
    CLOSED: '关闭'
  }
})

const list = ref<Warehouse[]>([])
const loading = ref(false)

const searchForm = reactive({
  type: '',
  status: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const detailVisible = ref(false)
const currentWarehouse = ref<Warehouse | null>(null)

const warehouseForm = reactive({
  id: 0,
  code: '',
  name: '',
  type: 'OWN' as 'OWN' | 'FBA' | 'THIRD_PARTY',
  country: '',
  address: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  remark: ''
})

const validateWarehouseCode = buildCodeValidator('仓库代码只允许字母、数字、中划线、下划线')

const formRules = computed<FormRules>(() => ({
  code: [
    { required: true, message: labels.value.codeRequired, trigger: 'blur' },
    { validator: validateWarehouseCode, trigger: 'blur' }
  ],
  name: [{ required: true, message: labels.value.nameRequired, trigger: 'blur' }],
  type: [{ required: true, message: labels.value.typeRequired, trigger: 'change' }]
}))

const loadList = async () => {
  loading.value = true
  try {
    const res = await getWarehouseList({
      page: pagination.page,
      page_size: pagination.page_size,
      type: searchForm.type || undefined,
      status: searchForm.status || undefined,
      keyword: searchForm.keyword || undefined
    })

    if (res.success && res.data) {
      list.value = res.data.data
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.message || labels.value.loadFailed)
    }
  } catch (error: any) {
    console.error('Failed to load warehouse list:', error)
    ElMessage.error(error.message || labels.value.loadFailed)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  void loadList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    type: '',
    status: '',
    keyword: ''
  })
  handleSearch()
}

const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = labels.value.createTitle
  Object.assign(warehouseForm, {
    id: 0,
    code: '',
    name: '',
    type: 'OWN',
    country: '',
    address: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    status: 'ACTIVE',
    remark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: Warehouse) => {
  isEdit.value = true
  dialogTitle.value = labels.value.editTitle
  Object.assign(warehouseForm, {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    country: row.country || '',
    address: row.address || '',
    contact_person: row.contact_person || '',
    contact_phone: row.contact_phone || '',
    contact_email: row.contact_email || '',
    status: row.status,
    remark: row.remark || ''
  })
  dialogVisible.value = true
}

const handleView = (row: Warehouse) => {
  currentWarehouse.value = row
  detailVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        if (isEdit.value) {
          await updateWarehouse(warehouseForm.id, warehouseForm)
          ElMessage.success(labels.value.updatedSuccess)
        } else {
          await createWarehouse(warehouseForm)
          ElMessage.success(labels.value.createdSuccess)
        }
        dialogVisible.value = false
        await loadList()
      } catch (error) {
        console.error('Save failed:', error)
      } finally {
        saving.value = false
      }
    }
  })
}

const handleDelete = async (row: Warehouse) => {
  if (row.deletable === false) {
    ElMessage.warning(row.delete_block_reason || '当前仓库不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(
      labels.value.deleteConfirm.replace('{name}', row.name),
      labels.value.deleteTitle,
      {
        confirmButtonText: labels.value.deleteConfirmText,
        cancelButtonText: labels.value.deleteCancelText,
        type: 'warning'
      }
    )

    await deleteWarehouse(row.id)
    ElMessage.success(labels.value.deletedSuccess)
    await loadList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

const getTypeLabel = (type: string) => {
  return (typeLabels.value as Record<string, string>)[type] || type
}

const getTypeColor = (type: string) => {
  return WAREHOUSE_TYPE_CONFIG[type as keyof typeof WAREHOUSE_TYPE_CONFIG]?.color || ''
}

const getStatusLabel = (status: string) => {
  return (statusLabels.value as Record<string, string>)[status] || status
}

const getStatusColor = (status: string) => {
  return WAREHOUSE_STATUS_CONFIG[status as keyof typeof WAREHOUSE_STATUS_CONFIG]?.color || ''
}

onMounted(() => {
  void loadList()
})
</script>

<style scoped>
.warehouse-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.page-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #909399;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.warehouse-main {
  display: grid;
  gap: 4px;
}

.warehouse-main__name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.warehouse-main__meta {
  font-size: 12px;
  color: #909399;
}

.type-status-block {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.type-status-block__meta {
  width: 100%;
  font-size: 12px;
  color: #909399;
}

.location-block,
.contact-block {
  display: grid;
  gap: 4px;
}

.location-block__country {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.location-block__address,
.contact-block__meta {
  font-size: 12px;
  line-height: 1.6;
  color: #909399;
  word-break: break-word;
}

.dialog-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 16px;
  align-items: start;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.span-full {
  grid-column: 1 / -1;
}

.dialog-summary {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  background: #f8fafc;
  padding: 16px;
  display: grid;
  gap: 12px;
}

.dialog-summary__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.dialog-summary__item {
  display: grid;
  gap: 4px;
}

.dialog-summary__item span {
  font-size: 12px;
  color: #909399;
}

.dialog-summary__item strong {
  font-size: 14px;
  color: #303133;
  word-break: break-word;
}

.detail-layout {
  display: grid;
  gap: 16px;
}

.detail-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
}

.detail-card--main {
  background: #f8fafc;
}

.detail-main__title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.detail-main__meta {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.detail-tags {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.detail-card__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  display: grid;
  gap: 4px;
}

.detail-item--full {
  grid-column: 1 / -1;
}

.detail-item span {
  font-size: 12px;
  color: #909399;
}

.detail-item strong {
  font-size: 14px;
  color: #303133;
  word-break: break-word;
}

@media (max-width: 1200px) {
}

@media (max-width: 900px) {
  .page-header,
  .dialog-layout {
    flex-direction: column;
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .dialog-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>

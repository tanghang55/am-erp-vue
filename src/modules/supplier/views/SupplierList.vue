<template>
  <div class="supplier-list-container">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">供应商管理</div>
            <div class="page-subtitle">维护产品、包材、物流供应商档案，联系人、结算账户和标签都在同一处管理。</div>
          </div>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增供应商
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="供应商名称 / 编号" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.types" placeholder="全部" clearable multiple style="width: 220px">
            <el-option v-for="item in supplierTypeOptions" :key="item" :label="getSupplierTypeLabel(item)" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="启用" value="ACTIVE" />
            <el-option label="停用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="supplierList" v-loading="loading" border stripe @expand-change="handleExpandChange">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-layout">
              <section class="expand-card">
                <div class="expand-card__header">
                  <span class="expand-card__title">联系人</span>
                  <el-button size="small" type="primary" @click="openContactCreate(row)">新增联系人</el-button>
                </div>
                <el-table :data="getSupplierDetailRow(row).contacts || []" size="small" border>
                  <el-table-column prop="name" label="姓名" width="160" />
                  <el-table-column prop="phone" label="电话" width="140" />
                  <el-table-column prop="email" label="邮箱" min-width="200" />
                  <el-table-column prop="position" label="职位" width="140" />
                  <el-table-column label="主联系人" width="100">
                    <template #default="{ row: contact }">
                      <el-tag v-if="contact.is_primary" type="success" size="small">是</el-tag>
                      <span v-else>-</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="140">
                    <template #default="{ row: contact }">
                      <el-button link type="primary" @click="openContactEdit(row, contact)">编辑</el-button>
                      <el-button link type="danger" @click="handleDeleteContact(row, contact)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </section>

              <section class="expand-card">
                <div class="expand-card__header">
                  <span class="expand-card__title">结算账户</span>
                  <el-button size="small" type="primary" @click="openAccountCreate(row)">新增账户</el-button>
                </div>
                <el-table :data="getSupplierDetailRow(row).accounts || []" size="small" border>
                  <el-table-column prop="bank_name" label="开户行" width="160" />
                  <el-table-column prop="bank_account" label="账号" width="180" />
                  <el-table-column prop="currency" label="币种" width="100" />
                  <el-table-column prop="tax_no" label="税号" width="140" />
                  <el-table-column prop="payment_terms" label="结算条件" min-width="180" />
                  <el-table-column label="操作" width="140">
                    <template #default="{ row: account }">
                      <el-button link type="primary" @click="openAccountEdit(row, account)">编辑</el-button>
                      <el-button link type="danger" @click="handleDeleteAccount(row, account)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </section>

              <section class="expand-card">
                <div class="expand-card__header">
                  <span class="expand-card__title">标签</span>
                  <el-button size="small" type="primary" @click="openTagCreate(row)">新增标签</el-button>
                </div>
                <el-table :data="getSupplierDetailRow(row).tags || []" size="small" border>
                  <el-table-column prop="tag" label="标签内容" min-width="220" />
                  <el-table-column label="操作" width="140">
                    <template #default="{ row: tag }">
                      <el-button link type="primary" @click="openTagEdit(row, tag)">编辑</el-button>
                      <el-button link type="danger" @click="handleDeleteTag(row, tag)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </section>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="供应商" min-width="280">
          <template #default="{ row }">
            <div class="supplier-main">
              <div class="supplier-main__name">{{ row.name }}</div>
              <div class="supplier-main__meta">{{ row.supplier_code }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="类型" min-width="220">
          <template #default="{ row }">
            <div class="type-list">
              <template v-if="row.types?.length">
                <el-tag v-for="type in row.types" :key="type" size="small" class="type-tag">
                  {{ getSupplierTypeLabel(type) }}
                </el-tag>
              </template>
              <span v-else>-</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态与备注" min-width="260">
          <template #default="{ row }">
            <div class="status-block">
              <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
              </el-tag>
              <el-tag v-if="row.deletable === false" type="warning" effect="plain" size="small">
                不可删除
              </el-tag>
              <div v-if="row.reference_count" class="status-block__remark">
                {{ row.reference_count }} 处引用
              </div>
              <div v-else-if="row.deletable === false" class="status-block__remark">
                {{ row.delete_block_reason || '已被业务数据引用，不可删除' }}
              </div>
              <div class="status-block__remark">{{ row.remark || '暂无备注' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.gmt_modified) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-tooltip
              v-if="row.deletable === false"
              :content="row.delete_block_reason || '已被业务数据引用，不可删除'"
              placement="top"
            >
              <el-button size="small" type="danger" disabled>删除</el-button>
            </el-tooltip>
            <el-button v-else size="small" type="danger" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="760px">
      <div class="dialog-layout">
        <el-form :model="supplierForm" :rules="supplierFormRules" ref="supplierFormRef" label-position="top" class="dialog-form">
          <div class="dialog-grid">
            <el-form-item label="供应商编号" prop="supplier_code">
              <el-input v-model="supplierForm.supplier_code" />
            </el-form-item>
            <el-form-item label="供应商名称" prop="name">
              <el-input v-model="supplierForm.name" />
            </el-form-item>
            <el-form-item label="供应商类型" class="span-full">
              <el-select v-model="supplierForm.types" multiple clearable style="width: 100%">
                <el-option v-for="item in supplierTypeOptions" :key="item" :label="getSupplierTypeLabel(item)" :value="item" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="supplierForm.status">
                <el-radio value="ACTIVE">启用</el-radio>
                <el-radio value="DISABLED">停用</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="备注" class="span-full">
              <el-input v-model="supplierForm.remark" type="textarea" :rows="4" />
            </el-form-item>
          </div>
        </el-form>

        <aside class="dialog-aside">
          <div class="dialog-summary">
            <div class="dialog-summary__title">档案摘要</div>
            <div class="dialog-summary__item">
              <span>供应商编号</span>
              <strong>{{ supplierForm.supplier_code || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>供应商名称</span>
              <strong>{{ supplierForm.name || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>类型数量</span>
              <strong>{{ supplierForm.types.length }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>状态</span>
              <strong>{{ supplierForm.status === 'ACTIVE' ? '启用' : '停用' }}</strong>
            </div>
          </div>
        </aside>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="contactDialogVisible" :title="contactDialogTitle" width="520px">
      <el-form :model="contactForm" :rules="contactFormRules" ref="contactFormRef" label-width="120px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="contactForm.name" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="contactForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="contactForm.email" />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="contactForm.position" />
        </el-form-item>
        <el-form-item label="主联系人">
          <el-switch v-model="contactForm.is_primary" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="contactDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="contactSaving" @click="handleSaveContact">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="accountDialogVisible" :title="accountDialogTitle" width="560px">
      <el-form :model="accountForm" :rules="accountFormRules" ref="accountFormRef" label-width="140px">
        <el-form-item label="开户行" prop="bank_name">
          <el-input v-model="accountForm.bank_name" />
        </el-form-item>
        <el-form-item label="账号" prop="bank_account">
          <el-input v-model="accountForm.bank_account" />
        </el-form-item>
        <el-form-item label="币种">
          <el-input v-model="accountForm.currency" />
        </el-form-item>
        <el-form-item label="税号">
          <el-input v-model="accountForm.tax_no" />
        </el-form-item>
        <el-form-item label="结算条件">
          <el-input v-model="accountForm.payment_terms" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="accountDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="accountSaving" @click="handleSaveAccount">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="tagDialogVisible" :title="tagDialogTitle" width="420px">
      <el-form :model="tagForm" :rules="tagFormRules" ref="tagFormRef" label-width="100px">
        <el-form-item label="标签" prop="tag">
          <el-input v-model="tagForm.tag" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="tagSaving" @click="handleSaveTag">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getSupplierList,
  getSupplierDetail,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  createSupplierContact,
  updateSupplierContact,
  deleteSupplierContact,
  createSupplierAccount,
  updateSupplierAccount,
  deleteSupplierAccount,
  createSupplierTag,
  updateSupplierTag,
  deleteSupplierTag
} from '../api'
import type { Supplier, SupplierType, SupplierContact, SupplierAccount, SupplierTag } from '../types'
import { buildCodeValidator } from '@/modules/common/utils/code'

const supplierList = ref<Supplier[]>([])
const supplierDetails = reactive<Record<number, Supplier>>({})
const loading = ref(false)

const searchForm = reactive({
  keyword: '',
  status: '',
  types: [] as SupplierType[]
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
const supplierFormRef = ref<FormInstance>()

const supplierForm = reactive({
  id: 0,
  supplier_code: '',
  name: '',
  types: [] as SupplierType[],
  status: 'ACTIVE',
  remark: ''
})

const validateSupplierCode = buildCodeValidator('供应商编号只允许字母、数字、中划线、下划线')

const supplierFormRules: FormRules = {
  supplier_code: [
    { required: true, message: '请输入供应商编号', trigger: 'blur' },
    { validator: validateSupplierCode, trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const supplierTypeOptions: SupplierType[] = ['PRODUCT', 'PACKAGING', 'LOGISTICS']
const supplierTypeLabelMap: Record<SupplierType, string> = {
  PRODUCT: '产品供应商',
  PACKAGING: '包材供应商',
  LOGISTICS: '物流供应商'
}

const contactDialogVisible = ref(false)
const contactDialogTitle = ref('')
const contactSaving = ref(false)
const contactFormRef = ref<FormInstance>()
const contactSupplierId = ref<number | null>(null)
const contactEditing = ref(false)

const contactForm = reactive({
  id: 0,
  name: '',
  phone: '',
  email: '',
  position: '',
  is_primary: 0
})

const contactFormRules: FormRules = {
  name: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }]
}

const accountDialogVisible = ref(false)
const accountDialogTitle = ref('')
const accountSaving = ref(false)
const accountFormRef = ref<FormInstance>()
const accountSupplierId = ref<number | null>(null)
const accountEditing = ref(false)

const accountForm = reactive({
  id: 0,
  bank_name: '',
  bank_account: '',
  currency: '',
  tax_no: '',
  payment_terms: ''
})

const accountFormRules: FormRules = {
  bank_name: [{ required: true, message: '请输入开户行', trigger: 'blur' }],
  bank_account: [{ required: true, message: '请输入账号', trigger: 'blur' }]
}

const tagDialogVisible = ref(false)
const tagDialogTitle = ref('')
const tagSaving = ref(false)
const tagFormRef = ref<FormInstance>()
const tagSupplierId = ref<number | null>(null)
const tagEditing = ref(false)

const tagForm = reactive({
  id: 0,
  tag: ''
})

const tagFormRules: FormRules = {
  tag: [{ required: true, message: '请输入标签', trigger: 'blur' }]
}

const getSupplierTypeLabel = (type: SupplierType) => supplierTypeLabelMap[type] || type

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 16)
}

const loadSupplierList = async () => {
  loading.value = true
  try {
    const res = await getSupplierList({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      type: searchForm.types.length ? searchForm.types.join(',') : undefined
    })

    if (res.success) {
      supplierList.value = res.data.data
      pagination.total = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const loadSupplierDetail = async (supplierId: number, force = false) => {
  if (!force && supplierDetails[supplierId]) return
  const res = await getSupplierDetail(supplierId)
  if (res.success) {
    supplierDetails[supplierId] = res.data
    const index = supplierList.value.findIndex((item) => item.id === supplierId)
    if (index >= 0) {
      supplierList.value[index] = { ...supplierList.value[index], ...res.data }
    }
  }
}

const getSupplierDetailRow = (row: Supplier) => supplierDetails[row.id] || row

const handleSearch = () => {
  pagination.page = 1
  void loadSupplierList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.types = []
  handleSearch()
}

const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = '新增供应商'
  Object.assign(supplierForm, {
    id: 0,
    supplier_code: '',
    name: '',
    types: [],
    status: 'ACTIVE',
    remark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: Supplier) => {
  isEdit.value = true
  dialogTitle.value = '编辑供应商'
  Object.assign(supplierForm, {
    id: row.id,
    supplier_code: row.supplier_code,
    name: row.name,
    types: row.types ? [...row.types] : [],
    status: row.status,
    remark: row.remark || ''
  })
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!supplierFormRef.value) return
  const valid = await supplierFormRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const payload = {
      supplier_code: supplierForm.supplier_code,
      name: supplierForm.name,
      status: supplierForm.status,
      remark: supplierForm.remark,
      types: supplierForm.types
    }
    if (isEdit.value) {
      await updateSupplier(supplierForm.id, payload)
      ElMessage.success('供应商更新成功')
    } else {
      await createSupplier(payload)
      ElMessage.success('供应商创建成功')
    }
    dialogVisible.value = false
    await loadSupplierList()
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row: Supplier) => {
  if (row.deletable === false) {
    ElMessage.warning(row.delete_block_reason || '当前供应商不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除供应商“${row.name}”吗？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteSupplier(row.id)
    ElMessage.success('供应商删除成功')
    await loadSupplierList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

const handleExpandChange = (row: Supplier) => {
  void loadSupplierDetail(row.id)
}

const openContactCreate = (supplier: Supplier) => {
  contactSupplierId.value = supplier.id
  contactEditing.value = false
  contactDialogTitle.value = '新增联系人'
  Object.assign(contactForm, {
    id: 0,
    name: '',
    phone: '',
    email: '',
    position: '',
    is_primary: 0
  })
  contactDialogVisible.value = true
}

const openContactEdit = (supplier: Supplier, contact: SupplierContact) => {
  contactSupplierId.value = supplier.id
  contactEditing.value = true
  contactDialogTitle.value = '编辑联系人'
  Object.assign(contactForm, {
    id: contact.id,
    name: contact.name || '',
    phone: contact.phone || '',
    email: contact.email || '',
    position: contact.position || '',
    is_primary: contact.is_primary || 0
  })
  contactDialogVisible.value = true
}

const handleSaveContact = async () => {
  if (!contactFormRef.value || !contactSupplierId.value) return
  const valid = await contactFormRef.value.validate().catch(() => false)
  if (!valid) return

  contactSaving.value = true
  try {
    const payload = {
      id: contactForm.id,
      name: contactForm.name,
      phone: contactForm.phone || undefined,
      email: contactForm.email || undefined,
      position: contactForm.position || undefined,
      is_primary: contactForm.is_primary
    }
    if (contactEditing.value) {
      await updateSupplierContact(contactSupplierId.value, payload)
      ElMessage.success('联系人更新成功')
    } else {
      const { id, ...createPayload } = payload
      await createSupplierContact(contactSupplierId.value, createPayload)
      ElMessage.success('联系人创建成功')
    }
    contactDialogVisible.value = false
    await loadSupplierDetail(contactSupplierId.value, true)
  } finally {
    contactSaving.value = false
  }
}

const handleDeleteContact = async (supplier: Supplier, contact: SupplierContact) => {
  try {
    await ElMessageBox.confirm('确认删除该联系人吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteSupplierContact(supplier.id, contact.id)
    ElMessage.success('联系人删除成功')
    await loadSupplierDetail(supplier.id, true)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

const openAccountCreate = (supplier: Supplier) => {
  accountSupplierId.value = supplier.id
  accountEditing.value = false
  accountDialogTitle.value = '新增账户'
  Object.assign(accountForm, {
    id: 0,
    bank_name: '',
    bank_account: '',
    currency: '',
    tax_no: '',
    payment_terms: ''
  })
  accountDialogVisible.value = true
}

const openAccountEdit = (supplier: Supplier, account: SupplierAccount) => {
  accountSupplierId.value = supplier.id
  accountEditing.value = true
  accountDialogTitle.value = '编辑账户'
  Object.assign(accountForm, {
    id: account.id,
    bank_name: account.bank_name || '',
    bank_account: account.bank_account || '',
    currency: account.currency || '',
    tax_no: account.tax_no || '',
    payment_terms: account.payment_terms || ''
  })
  accountDialogVisible.value = true
}

const handleSaveAccount = async () => {
  if (!accountFormRef.value || !accountSupplierId.value) return
  const valid = await accountFormRef.value.validate().catch(() => false)
  if (!valid) return

  accountSaving.value = true
  try {
    const payload = {
      id: accountForm.id,
      bank_name: accountForm.bank_name,
      bank_account: accountForm.bank_account,
      currency: accountForm.currency || undefined,
      tax_no: accountForm.tax_no || undefined,
      payment_terms: accountForm.payment_terms || undefined
    }
    if (accountEditing.value) {
      await updateSupplierAccount(accountSupplierId.value, payload)
      ElMessage.success('账户更新成功')
    } else {
      const { id, ...createPayload } = payload
      await createSupplierAccount(accountSupplierId.value, createPayload)
      ElMessage.success('账户创建成功')
    }
    accountDialogVisible.value = false
    await loadSupplierDetail(accountSupplierId.value, true)
  } finally {
    accountSaving.value = false
  }
}

const handleDeleteAccount = async (supplier: Supplier, account: SupplierAccount) => {
  try {
    await ElMessageBox.confirm('确认删除该账户吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteSupplierAccount(supplier.id, account.id)
    ElMessage.success('账户删除成功')
    await loadSupplierDetail(supplier.id, true)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

const openTagCreate = (supplier: Supplier) => {
  tagSupplierId.value = supplier.id
  tagEditing.value = false
  tagDialogTitle.value = '新增标签'
  Object.assign(tagForm, {
    id: 0,
    tag: ''
  })
  tagDialogVisible.value = true
}

const openTagEdit = (supplier: Supplier, tag: SupplierTag) => {
  tagSupplierId.value = supplier.id
  tagEditing.value = true
  tagDialogTitle.value = '编辑标签'
  Object.assign(tagForm, {
    id: tag.id,
    tag: tag.tag || ''
  })
  tagDialogVisible.value = true
}

const handleSaveTag = async () => {
  if (!tagFormRef.value || !tagSupplierId.value) return
  const valid = await tagFormRef.value.validate().catch(() => false)
  if (!valid) return

  tagSaving.value = true
  try {
    const payload = {
      id: tagForm.id,
      tag: tagForm.tag
    }
    if (tagEditing.value) {
      await updateSupplierTag(tagSupplierId.value, payload)
      ElMessage.success('标签更新成功')
    } else {
      const { id, ...createPayload } = payload
      await createSupplierTag(tagSupplierId.value, createPayload)
      ElMessage.success('标签创建成功')
    }
    tagDialogVisible.value = false
    await loadSupplierDetail(tagSupplierId.value, true)
  } finally {
    tagSaving.value = false
  }
}

const handleDeleteTag = async (supplier: Supplier, tag: SupplierTag) => {
  try {
    await ElMessageBox.confirm('确认删除该标签吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteSupplierTag(supplier.id, tag.id)
    ElMessage.success('标签删除成功')
    await loadSupplierDetail(supplier.id, true)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

onMounted(() => {
  void loadSupplierList()
})
</script>

<style scoped>
.supplier-list-container {
  width: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  margin-bottom: 16px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.supplier-main {
  display: grid;
  gap: 4px;
}

.supplier-main__name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.supplier-main__meta {
  font-size: 12px;
  color: #909399;
}

.type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.type-tag {
  margin-right: 0;
}

.status-block {
  display: grid;
  gap: 8px;
}

.status-block__remark {
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
  word-break: break-word;
}

.expand-layout {
  display: grid;
  gap: 16px;
  padding: 12px 0;
}

.expand-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
}

.expand-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.expand-card__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
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

@media (max-width: 900px) {
  .page-header,
  .dialog-layout {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }

  .dialog-grid {
    grid-template-columns: 1fr;
  }
}
</style>

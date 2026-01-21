<template>
  <div class="supplier-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>Supplier Management</h3>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            Create Supplier
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="Keyword">
          <el-input v-model="searchForm.keyword" placeholder="Name or Code" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="Type">
          <el-select v-model="searchForm.types" placeholder="All" clearable multiple style="width: 200px">
            <el-option v-for="item in supplierTypeOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="searchForm.status" placeholder="All" clearable>
            <el-option label="Active" value="ACTIVE" />
            <el-option label="Disabled" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">Search</el-button>
          <el-button @click="handleReset">Reset</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="supplierList" v-loading="loading" border stripe @expand-change="handleExpandChange">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-section">
              <div class="section-header">
                <span class="section-title">Contacts</span>
                <el-button size="small" type="primary" @click="openContactCreate(row)">Add</el-button>
              </div>
              <el-table :data="getSupplierDetailRow(row).contacts || []" size="small" border>
                <el-table-column prop="name" label="Name" width="160" />
                <el-table-column prop="phone" label="Phone" width="140" />
                <el-table-column prop="email" label="Email" min-width="200" />
                <el-table-column prop="position" label="Position" width="140" />
                <el-table-column label="Primary" width="90">
                  <template #default="{ row: contact }">
                    <el-tag v-if="contact.is_primary" type="success" size="small">Yes</el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="Actions" width="140">
                  <template #default="{ row: contact }">
                    <el-button link type="primary" @click="openContactEdit(row, contact)">Edit</el-button>
                    <el-button link type="danger" @click="handleDeleteContact(row, contact)">Delete</el-button>
                  </template>
                </el-table-column>
              </el-table>

              <el-divider />

              <div class="section-header">
                <span class="section-title">Accounts</span>
                <el-button size="small" type="primary" @click="openAccountCreate(row)">Add</el-button>
              </div>
              <el-table :data="getSupplierDetailRow(row).accounts || []" size="small" border>
                <el-table-column prop="bank_name" label="Bank" width="160" />
                <el-table-column prop="bank_account" label="Account" width="180" />
                <el-table-column prop="currency" label="Currency" width="100" />
                <el-table-column prop="tax_no" label="Tax No" width="140" />
                <el-table-column prop="payment_terms" label="Payment Terms" min-width="160" />
                <el-table-column label="Actions" width="140">
                  <template #default="{ row: account }">
                    <el-button link type="primary" @click="openAccountEdit(row, account)">Edit</el-button>
                    <el-button link type="danger" @click="handleDeleteAccount(row, account)">Delete</el-button>
                  </template>
                </el-table-column>
              </el-table>

              <el-divider />

              <div class="section-header">
                <span class="section-title">Tags</span>
                <el-button size="small" type="primary" @click="openTagCreate(row)">Add</el-button>
              </div>
              <el-table :data="getSupplierDetailRow(row).tags || []" size="small" border>
                <el-table-column prop="tag" label="Tag" min-width="200" />
                <el-table-column label="Actions" width="140">
                  <template #default="{ row: tag }">
                    <el-button link type="primary" @click="openTagEdit(row, tag)">Edit</el-button>
                    <el-button link type="danger" @click="handleDeleteTag(row, tag)">Delete</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="supplier_code" label="Code" width="140" show-overflow-tooltip />
        <el-table-column prop="name" label="Name" width="200" show-overflow-tooltip />
        <el-table-column label="Types" width="200">
          <template #default="{ row }">
            <template v-if="row.types && row.types.length">
              <el-tag v-for="type in row.types" :key="type" size="small" class="type-tag">
                {{ type }}
              </el-tag>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Status" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="Remark" min-width="240" show-overflow-tooltip />
        <el-table-column label="Actions" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">Edit</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">Delete</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="620px">
      <el-form :model="supplierForm" :rules="supplierFormRules" ref="supplierFormRef" label-width="140px">
        <el-form-item label="Supplier Code" prop="supplier_code">
          <el-input v-model="supplierForm.supplier_code" />
        </el-form-item>
        <el-form-item label="Name" prop="name">
          <el-input v-model="supplierForm.name" />
        </el-form-item>
        <el-form-item label="Types">
          <el-select v-model="supplierForm.types" multiple clearable>
            <el-option v-for="item in supplierTypeOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="Status" prop="status">
          <el-radio-group v-model="supplierForm.status">
            <el-radio value="ACTIVE">Active</el-radio>
            <el-radio value="DISABLED">Disabled</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Remark">
          <el-input v-model="supplierForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">Save</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="contactDialogVisible" :title="contactDialogTitle" width="520px">
      <el-form :model="contactForm" :rules="contactFormRules" ref="contactFormRef" label-width="120px">
        <el-form-item label="Name" prop="name">
          <el-input v-model="contactForm.name" />
        </el-form-item>
        <el-form-item label="Phone">
          <el-input v-model="contactForm.phone" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="contactForm.email" />
        </el-form-item>
        <el-form-item label="Position">
          <el-input v-model="contactForm.position" />
        </el-form-item>
        <el-form-item label="Primary">
          <el-switch v-model="contactForm.is_primary" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="contactDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="contactSaving" @click="handleSaveContact">Save</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="accountDialogVisible" :title="accountDialogTitle" width="560px">
      <el-form :model="accountForm" :rules="accountFormRules" ref="accountFormRef" label-width="140px">
        <el-form-item label="Bank Name" prop="bank_name">
          <el-input v-model="accountForm.bank_name" />
        </el-form-item>
        <el-form-item label="Bank Account" prop="bank_account">
          <el-input v-model="accountForm.bank_account" />
        </el-form-item>
        <el-form-item label="Currency">
          <el-input v-model="accountForm.currency" />
        </el-form-item>
        <el-form-item label="Tax No">
          <el-input v-model="accountForm.tax_no" />
        </el-form-item>
        <el-form-item label="Payment Terms">
          <el-input v-model="accountForm.payment_terms" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="accountDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="accountSaving" @click="handleSaveAccount">Save</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="tagDialogVisible" :title="tagDialogTitle" width="420px">
      <el-form :model="tagForm" :rules="tagFormRules" ref="tagFormRef" label-width="100px">
        <el-form-item label="Tag" prop="tag">
          <el-input v-model="tagForm.tag" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="tagSaving" @click="handleSaveTag">Save</el-button>
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

const supplierFormRules: FormRules = {
  supplier_code: [{ required: true, message: 'Required', trigger: 'blur' }],
  name: [{ required: true, message: 'Required', trigger: 'blur' }],
  status: [{ required: true, message: 'Required', trigger: 'change' }]
}

const supplierTypeOptions: SupplierType[] = ['PRODUCT', 'PACKAGING', 'LOGISTICS']

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
  name: [{ required: true, message: 'Required', trigger: 'blur' }]
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
  bank_name: [{ required: true, message: 'Required', trigger: 'blur' }],
  bank_account: [{ required: true, message: 'Required', trigger: 'blur' }]
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
  tag: [{ required: true, message: 'Required', trigger: 'blur' }]
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
  loadSupplierList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.types = []
  handleSearch()
}

const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = 'Create Supplier'
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
  dialogTitle.value = 'Edit Supplier'
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
      ElMessage.success('Supplier updated successfully')
    } else {
      await createSupplier(payload)
      ElMessage.success('Supplier created successfully')
    }
    dialogVisible.value = false
    loadSupplierList()
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row: Supplier) => {
  try {
    await ElMessageBox.confirm(`Are you sure to delete supplier "${row.name}"?`, 'Warning', {
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })

    await deleteSupplier(row.id)
    ElMessage.success('Supplier deleted successfully')
    loadSupplierList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

const handleExpandChange = (row: Supplier) => {
  loadSupplierDetail(row.id)
}

const openContactCreate = (supplier: Supplier) => {
  contactSupplierId.value = supplier.id
  contactEditing.value = false
  contactDialogTitle.value = 'Add Contact'
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
  contactDialogTitle.value = 'Edit Contact'
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
      ElMessage.success('Contact updated successfully')
    } else {
      const { id, ...createPayload } = payload
      await createSupplierContact(contactSupplierId.value, createPayload)
      ElMessage.success('Contact created successfully')
    }
    contactDialogVisible.value = false
    loadSupplierDetail(contactSupplierId.value, true)
  } finally {
    contactSaving.value = false
  }
}

const handleDeleteContact = async (supplier: Supplier, contact: SupplierContact) => {
  try {
    await ElMessageBox.confirm('Are you sure to delete this contact?', 'Warning', {
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    await deleteSupplierContact(supplier.id, contact.id)
    ElMessage.success('Contact deleted successfully')
    loadSupplierDetail(supplier.id, true)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

const openAccountCreate = (supplier: Supplier) => {
  accountSupplierId.value = supplier.id
  accountEditing.value = false
  accountDialogTitle.value = 'Add Account'
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
  accountDialogTitle.value = 'Edit Account'
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
      ElMessage.success('Account updated successfully')
    } else {
      const { id, ...createPayload } = payload
      await createSupplierAccount(accountSupplierId.value, createPayload)
      ElMessage.success('Account created successfully')
    }
    accountDialogVisible.value = false
    loadSupplierDetail(accountSupplierId.value, true)
  } finally {
    accountSaving.value = false
  }
}

const handleDeleteAccount = async (supplier: Supplier, account: SupplierAccount) => {
  try {
    await ElMessageBox.confirm('Are you sure to delete this account?', 'Warning', {
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    await deleteSupplierAccount(supplier.id, account.id)
    ElMessage.success('Account deleted successfully')
    loadSupplierDetail(supplier.id, true)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

const openTagCreate = (supplier: Supplier) => {
  tagSupplierId.value = supplier.id
  tagEditing.value = false
  tagDialogTitle.value = 'Add Tag'
  Object.assign(tagForm, {
    id: 0,
    tag: ''
  })
  tagDialogVisible.value = true
}

const openTagEdit = (supplier: Supplier, tag: SupplierTag) => {
  tagSupplierId.value = supplier.id
  tagEditing.value = true
  tagDialogTitle.value = 'Edit Tag'
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
      ElMessage.success('Tag updated successfully')
    } else {
      const { id, ...createPayload } = payload
      await createSupplierTag(tagSupplierId.value, createPayload)
      ElMessage.success('Tag created successfully')
    }
    tagDialogVisible.value = false
    loadSupplierDetail(tagSupplierId.value, true)
  } finally {
    tagSaving.value = false
  }
}

const handleDeleteTag = async (supplier: Supplier, tag: SupplierTag) => {
  try {
    await ElMessageBox.confirm('Are you sure to delete this tag?', 'Warning', {
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    await deleteSupplierTag(supplier.id, tag.id)
    ElMessage.success('Tag deleted successfully')
    loadSupplierDetail(supplier.id, true)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

onMounted(() => {
  loadSupplierList()
})
</script>

<style scoped>
.supplier-list-container {
  width: 100%;
  max-width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.expand-section {
  padding: 10px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-weight: 600;
  color: #111827;
}

.type-tag {
  margin-right: 6px;
}
</style>

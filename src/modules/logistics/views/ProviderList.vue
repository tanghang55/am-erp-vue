<template>
  <div class="provider-list">
    <el-card>
      <!-- 搜索表单 -->
      <el-form :model="searchForm" inline>
        <el-form-item label="供应商类型">
          <el-select v-model="searchForm.provider_type" placeholder="全部" clearable style="width: 150px">
            <el-option
              v-for="(config, key) in PROVIDER_TYPE_CONFIG"
              :key="key"
              :label="config.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
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
            placeholder="供应商编号/名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleCreate">新增供应商</el-button>
        </el-form-item>
      </el-form>

      <!-- 列表表格 -->
      <el-table :data="list" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="provider_code" label="供应商编号" width="150" />
        <el-table-column prop="provider_name" label="供应商名称" min-width="180" />
        <el-table-column prop="provider_type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="PROVIDER_TYPE_CONFIG[row.provider_type]?.color">
              {{ PROVIDER_TYPE_CONFIG[row.provider_type]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="service_types" label="服务类型" width="150" />
        <el-table-column prop="contact_person" label="联系人" width="100" />
        <el-table-column prop="contact_phone" label="联系电话" width="130" />
        <el-table-column prop="account_number" label="客户账号" width="150" />
        <el-table-column prop="credit_days" label="账期(天)" width="90" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="PROVIDER_STATUS_CONFIG[row.status]?.color">
              {{ PROVIDER_STATUS_CONFIG[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadList"
          @size-change="loadList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="供应商编号" prop="provider_code">
          <el-input v-model="formData.provider_code" placeholder="请输入供应商编号" />
        </el-form-item>
        <el-form-item label="供应商名称" prop="provider_name">
          <el-input v-model="formData.provider_name" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="供应商类型" prop="provider_type">
          <el-select v-model="formData.provider_type" placeholder="请选择" style="width: 100%">
            <el-option
              v-for="(config, key) in PROVIDER_TYPE_CONFIG"
              :key="key"
              :label="config.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="服务类型">
          <el-input
            v-model="formData.service_types"
            placeholder="如: EXPRESS,AIR,SEA (逗号分隔)"
          />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="formData.contact_person" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="formData.contact_phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="联系邮箱">
          <el-input v-model="formData.contact_email" placeholder="请输入联系邮箱" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input
            v-model="formData.address"
            type="textarea"
            :rows="2"
            placeholder="请输入地址"
          />
        </el-form-item>
        <el-form-item label="客户账号">
          <el-input v-model="formData.account_number" placeholder="请输入客户账号" />
        </el-form-item>
        <el-form-item label="账期(天)">
          <el-input-number
            v-model="formData.credit_days"
            :min="0"
            :max="365"
            placeholder="请输入账期天数"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="ACTIVE">启用</el-radio>
            <el-radio label="INACTIVE">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  getProviders,
  createProvider,
  updateProvider,
  deleteProvider
} from '../api'
import type {
  LogisticsProvider,
  ProviderListParams,
  CreateProviderParams
} from '../types'
import {
  PROVIDER_TYPE_CONFIG,
  PROVIDER_STATUS_CONFIG
} from '../types'
import { parsePaginatedResponse } from '@/utils/api'

// 搜索表单
const searchForm = reactive<ProviderListParams>({
  provider_type: undefined,
  status: undefined,
  keyword: ''
})

// 列表数据
const list = ref<LogisticsProvider[]>([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const dialogTitle = computed(() => dialogMode.value === 'create' ? '新增供应商' : '编辑供应商')
const formRef = ref<FormInstance>()
const submitting = ref(false)

// 表单数据
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

// 表单验证规则
const formRules: FormRules = {
  provider_code: [
    { required: true, message: '请输入供应商编号', trigger: 'blur' }
  ],
  provider_name: [
    { required: true, message: '请输入供应商名称', trigger: 'blur' }
  ],
  provider_type: [
    { required: true, message: '请选择供应商类型', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 加载列表
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
      ElMessage.error(error.message || '加载列表失败')
    }
  } finally {
    loading.value = false
  }
}

// 查询
const handleSearch = () => {
  pagination.page = 1
  loadList()
}

// 重置
const handleReset = () => {
  searchForm.provider_type = undefined
  searchForm.status = undefined
  searchForm.keyword = ''
  pagination.page = 1
  loadList()
}

// 新增
const handleCreate = () => {
  dialogMode.value = 'create'
  Object.assign(formData, defaultFormData)
  dialogVisible.value = true
}

// 编辑
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

// 删除
const handleDelete = async (row: LogisticsProvider) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除供应商"${row.provider_name}"吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteProvider(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (error: any) {
    if (error !== 'cancel' && !error._handled) {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 提交表单
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

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 初始加载
loadList()
</script>

<style scoped>
.provider-list {
  padding: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

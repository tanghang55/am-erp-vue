<template>
  <div class="service-list">
    <el-card>
      <!-- 搜索表单 -->
      <el-form :model="searchForm" inline>
        <el-form-item label="运输方式">
          <el-select v-model="searchForm.transport_mode" placeholder="全部" clearable style="width: 150px">
            <el-option
              v-for="(config, key) in TRANSPORT_MODE_CONFIG"
              :key="key"
              :label="config.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
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
            placeholder="服务名称/代码/目的地"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleCreate">新增服务</el-button>
        </el-form-item>
      </el-form>

      <!-- 列表表格 -->
      <el-table :data="list" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="service_code" label="服务代码" width="150" />
        <el-table-column prop="service_name" label="服务名称" min-width="150" />
        <el-table-column prop="transport_mode" label="运输方式" width="100">
          <template #default="{ row }">
            {{ TRANSPORT_MODE_CONFIG[row.transport_mode]?.icon }}
            {{ TRANSPORT_MODE_CONFIG[row.transport_mode]?.label }}
          </template>
        </el-table-column>
        <el-table-column prop="destination_region" label="目的地站点/国家" width="150">
          <template #default="{ row }">
            {{ row.destination_region || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="服务描述" min-width="200">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="SERVICE_STATUS_CONFIG[row.status]?.color">
              {{ SERVICE_STATUS_CONFIG[row.status]?.label }}
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
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="服务代码" prop="service_code">
          <el-input
            v-model="formData.service_code"
            placeholder="如：SEA_SLOW_US、AIR_EXPRESS"
            clearable
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px">
            英文大写+下划线，用于系统识别
          </div>
        </el-form-item>

        <el-form-item label="服务名称" prop="service_name">
          <el-input
            v-model="formData.service_name"
            placeholder="如：美国慢船、快速空运"
            clearable
          />
        </el-form-item>

        <el-form-item label="运输方式" prop="transport_mode">
          <el-select v-model="formData.transport_mode" placeholder="请选择" style="width: 100%">
            <el-option
              v-for="(config, key) in TRANSPORT_MODE_CONFIG"
              :key="key"
              :label="config.icon + ' ' + config.label"
              :value="key"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="目的地站点/国家">
          <el-input
            v-model="formData.destination_region"
            placeholder="如：美国、欧洲、日本"
            clearable
          />
        </el-form-item>

        <el-form-item label="服务描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="服务的详细说明"
          />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  getLogisticsServices,
  createLogisticsService,
  updateLogisticsService,
  deleteLogisticsService
} from '../api'
import type {
  LogisticsService,
  LogisticsServiceListParams,
  CreateLogisticsServiceParams
} from '../types'
import {
  TRANSPORT_MODE_CONFIG,
  SERVICE_STATUS_CONFIG
} from '../types'
import { parsePaginatedResponse } from '@/utils/api'

// 搜索表单
const searchForm = reactive<LogisticsServiceListParams>({
  transport_mode: undefined,
  status: undefined,
  keyword: ''
})

// 列表数据
const list = ref<LogisticsService[]>([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const dialogTitle = computed(() => dialogMode.value === 'create' ? '新增服务' : '编辑服务')
const formRef = ref<FormInstance>()
const submitting = ref(false)

// 表单数据
const defaultFormData: CreateLogisticsServiceParams = {
  service_code: '',
  service_name: '',
  transport_mode: 'SEA',
  destination_region: '',
  description: '',
  status: 'ACTIVE'
}

const formData = reactive<CreateLogisticsServiceParams & { id?: number }>({ ...defaultFormData })

// 表单验证规则
const formRules: FormRules = {
  service_code: [
    { required: true, message: '请输入服务代码', trigger: 'blur' }
  ],
  service_name: [
    { required: true, message: '请输入服务名称', trigger: 'blur' }
  ],
  transport_mode: [
    { required: true, message: '请选择运输方式', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 加载列表
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
  searchForm.transport_mode = undefined
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

// 删除
const handleDelete = async (row: LogisticsService) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除此服务吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteLogisticsService(row.id)
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

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 初始化
onMounted(() => {
  loadList()
})
</script>

<style scoped>
.service-list {
  padding: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

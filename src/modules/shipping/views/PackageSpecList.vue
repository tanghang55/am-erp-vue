<template>
  <div class="package-spec-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">装箱规格管理</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建装箱规格
          </el-button>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="名称搜索"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" value="ACTIVE" />
            <el-option label="停用" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column label="尺寸 (长x宽x高)" width="180">
          <template #default="{ row }">
            {{ row.length }} x {{ row.width }} x {{ row.height }} cm
          </template>
        </el-table-column>
        <el-table-column label="体积" width="120">
          <template #default="{ row }">
            {{ calculateVolume(row) }} m³
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="重量 (kg)" width="100">
          <template #default="{ row }">
            {{ row.weight }}
          </template>
        </el-table-column>
        <el-table-column prop="quantity_per_box" label="每箱数量" width="100" align="center" />
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
              {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gmt_modified" label="更新时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.gmt_modified) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新建/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑装箱规格' : '新建装箱规格'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="输入装箱规格名称" />
        </el-form-item>
        <el-form-item label="长度 (cm)" prop="length">
          <el-input-number
            v-model="formData.length"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="宽度 (cm)" prop="width">
          <el-input-number
            v-model="formData.width"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="高度 (cm)" prop="height">
          <el-input-number
            v-model="formData.height"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="重量 (kg)" prop="weight">
          <el-input-number
            v-model="formData.weight"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="每箱数量" prop="quantity_per_box">
          <el-input-number
            v-model="formData.quantity_per_box"
            :min="1"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item v-if="editingId" label="状态">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option label="启用" value="ACTIVE" />
            <el-option label="停用" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="2"
            placeholder="输入备注"
          />
        </el-form-item>

        <!-- 包材配置 -->
        <el-divider v-if="editingId" content-position="left">包材配置</el-divider>
        <div v-if="editingId" class="packaging-config-section">
          <el-button
            type="primary"
            :icon="Plus"
            size="small"
            @click="handleAddPackagingItem"
            style="margin-bottom: 12px"
          >
            添加包材
          </el-button>

          <el-table :data="packagingItems" border size="small" v-if="packagingItems.length > 0">
            <el-table-column type="index" label="#" width="50" />

            <el-table-column label="包材名称" width="200">
              <template #default="{ row }">
                <el-select
                  v-model="row.packaging_item_id"
                  placeholder="选择包材"
                  filterable
                  size="small"
                  style="width: 100%"
                  @change="handlePackagingItemSelect(row)"
                >
                  <el-option
                    v-for="item in availablePackagingItems"
                    :key="item.id"
                    :label="`${item.item_name} (${item.item_code})`"
                    :value="item.id"
                  >
                    <div style="display: flex; justify-content: space-between">
                      <span>{{ item.item_name }}</span>
                      <span style="color: #909399; font-size: 12px">{{ item.specification || '-' }}</span>
                    </div>
                  </el-option>
                </el-select>
              </template>
            </el-table-column>

            <el-table-column label="单位" width="80">
              <template #default="{ row }">
                {{ row._packagingDetail?.unit || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="每箱消耗" width="150">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.quantity_per_box"
                  :min="0"
                  :precision="3"
                  :controls="false"
                  size="small"
                  placeholder="数量"
                  style="width: 100%"
                />
              </template>
            </el-table-column>

            <el-table-column label="备注" min-width="120">
              <template #default="{ row }">
                <el-input
                  v-model="row.notes"
                  placeholder="备注"
                  size="small"
                />
              </template>
            </el-table-column>

            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ $index }">
                <el-button
                  size="small"
                  type="danger"
                  link
                  @click="handleRemovePackagingItem($index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-else
            description="暂未配置包材"
            :image-size="60"
          />
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getPackageSpecList,
  createPackageSpec,
  updatePackageSpec,
  deletePackageSpec,
  getPackageSpecPackagingItems,
  savePackageSpecPackagingItems
} from '../api'
import type { PackageSpec, PackageSpecPackagingItem } from '../types'
import { getPackagingItemList } from '@/modules/packaging/api'
import type { PackagingItem } from '@/modules/packaging/types'

const loading = ref(false)
const list = ref<PackageSpec[]>([])
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const searchForm = reactive({
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const formData = reactive({
  name: '',
  length: 0,
  width: 0,
  height: 0,
  weight: 0,
  quantity_per_box: 1,
  remark: '',
  status: 'ACTIVE'
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  length: [{ required: true, message: '请输入长度', trigger: 'blur' }],
  width: [{ required: true, message: '请输入宽度', trigger: 'blur' }],
  height: [{ required: true, message: '请输入高度', trigger: 'blur' }],
  weight: [{ required: true, message: '请输入重量', trigger: 'blur' }],
  quantity_per_box: [{ required: true, message: '请输入每箱数量', trigger: 'blur' }]
}

// 包材配置
const packagingItems = ref<Array<PackageSpecPackagingItem & { _packagingDetail?: PackagingItem }>>([])
const availablePackagingItems = ref<PackagingItem[]>([])

const loadList = async () => {
  loading.value = true
  try {
    const res = await getPackageSpecList({
      page: pagination.page,
      page_size: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined
    })
    if (res.success) {
      const items = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : []
      list.value = items
      pagination.total = res.data?.total ?? 0
    }
  } catch (error) {
    console.error('Load package spec list failed:', error)
    ElMessage.error('加载装箱规格列表失败')
  } finally {
    loading.value = false
  }
}

const calculateVolume = (row: PackageSpec): string => {
  const volume = (row.length * row.width * row.height) / 1000000
  return volume.toFixed(4)
}

const formatTime = (time: string): string => {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 19)
}

const handleSearch = () => {
  pagination.page = 1
  loadList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  pagination.page = 1
  loadList()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadList()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadList()
}

const resetForm = () => {
  formData.name = ''
  formData.length = 0
  formData.width = 0
  formData.height = 0
  formData.weight = 0
  formData.quantity_per_box = 1
  formData.remark = ''
  formData.status = 'ACTIVE'
}

const handleCreate = () => {
  editingId.value = null
  resetForm()
  // 清空包材列表
  packagingItems.value = []
  dialogVisible.value = true
}

const handleEdit = async (row: PackageSpec) => {
  editingId.value = row.id
  formData.name = row.name
  formData.length = row.length
  formData.width = row.width
  formData.height = row.height
  formData.weight = row.weight
  formData.quantity_per_box = row.quantity_per_box || 1
  formData.remark = row.remark || ''
  formData.status = row.status

  // 加载可用包材列表
  await loadAvailablePackagingItems()

  // 加载装箱规格的包材配置
  await loadPackageSpecPackagingItems(row.id)

  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    if (editingId.value) {
      // 更新装箱规格
      await updatePackageSpec(editingId.value, {
        name: formData.name,
        length: formData.length,
        width: formData.width,
        height: formData.height,
        weight: formData.weight,
        quantity_per_box: formData.quantity_per_box,
        remark: formData.remark || undefined,
        status: formData.status
      })

      // 保存包材配置
      if (packagingItems.value.length > 0) {
        const validItems = packagingItems.value.filter(
          item => item.packaging_item_id && item.quantity_per_box > 0
        )
        await savePackageSpecPackagingItems(editingId.value, {
          packaging_items: validItems.map(item => ({
            packaging_item_id: item.packaging_item_id,
            quantity_per_box: item.quantity_per_box,
            notes: item.notes
          }))
        })
      }

      ElMessage.success('更新成功')
    } else {
      await createPackageSpec({
        name: formData.name,
        length: formData.length,
        width: formData.width,
        height: formData.height,
        weight: formData.weight,
        quantity_per_box: formData.quantity_per_box,
        remark: formData.remark || undefined
      })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (error: any) {
    console.error('Submit failed:', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row: PackageSpec) => {
  try {
    await ElMessageBox.confirm(`确定要删除装箱规格 "${row.name}" 吗？`, '提示', {
      type: 'warning'
    })
    await deletePackageSpec(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// ========== 包材配置相关方法 ==========

// 加载可用包材列表
const loadAvailablePackagingItems = async () => {
  try {
    const res = await getPackagingItemList({
      status: 'ACTIVE',
      page: 1,
      page_size: 1000
    })
    availablePackagingItems.value = res.data?.data || []
  } catch (error: any) {
    console.error('加载包材列表失败:', error)
  }
}

// 加载装箱规格的包材配置
const loadPackageSpecPackagingItems = async (packageSpecId: number) => {
  try {
    const res = await getPackageSpecPackagingItems(packageSpecId)
    const items = Array.isArray(res.data) ? res.data : []
    packagingItems.value = items.map(item => ({
      ...item,
      _packagingDetail: availablePackagingItems.value.find(p => p.id === item.packaging_item_id)
    }))
  } catch (error: any) {
    console.error('加载装箱规格包材配置失败:', error)
    packagingItems.value = []
  }
}

// 添加包材项
const handleAddPackagingItem = () => {
  packagingItems.value.push({
    packaging_item_id: 0,
    quantity_per_box: 0,
    notes: ''
  })
}

// 删除包材项
const handleRemovePackagingItem = (index: number) => {
  packagingItems.value.splice(index, 1)
}

// 包材选择变更
const handlePackagingItemSelect = (row: PackageSpecPackagingItem & { _packagingDetail?: PackagingItem }) => {
  const selected = availablePackagingItems.value.find(item => item.id === row.packaging_item_id)
  if (selected) {
    row._packagingDetail = selected
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.package-spec-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 16px;
  font-weight: 600;
}

.search-form {
  margin-bottom: 16px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>

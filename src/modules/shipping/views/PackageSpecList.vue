<template>
  <div class="package-spec-list-container">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">装箱规格管理</div>
            <div class="page-subtitle">维护装箱尺寸、每箱容量和配套包材配置，供发货和装箱流程统一引用。</div>
          </div>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建装箱规格
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="规格名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="启用" value="ACTIVE" />
            <el-option label="停用" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column label="装箱规格" min-width="260">
          <template #default="{ row }">
            <div class="spec-main">
              <div class="spec-main__name">{{ row.name }}</div>
              <div class="spec-main__meta">{{ row.length }} × {{ row.width }} × {{ row.height }} cm</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="箱体参数" min-width="220">
          <template #default="{ row }">
            <div class="metric-block">
              <div>体积 {{ calculateVolume(row) }} m³</div>
              <div class="metric-block__meta">重量 {{ row.weight }} kg</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="装箱能力" min-width="220">
          <template #default="{ row }">
            <div class="metric-block">
              <div>每箱 {{ row.quantity_per_box }} 件</div>
              <div class="metric-block__meta">{{ row.remark || '暂无备注' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <div class="status-block">
              <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
              </el-tag>
              <el-tag v-if="row.deletable === false" type="warning" effect="plain" size="small">不可删除</el-tag>
              <div v-if="row.reference_count" class="status-block__meta">{{ row.reference_count }} 处引用</div>
              <div v-else-if="row.deletable === false" class="status-block__meta">
                {{ row.delete_block_reason || '已被发货明细引用，不可删除' }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">{{ formatTime(row.gmt_modified) }}</template>
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

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑装箱规格' : '新建装箱规格'"
      width="920px"
      :close-on-click-modal="false"
    >
      <div class="dialog-layout">
        <div class="dialog-main">
          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-position="top"
            class="dialog-form"
          >
            <div class="dialog-grid">
              <el-form-item label="规格名称" prop="name">
                <el-input v-model="formData.name" placeholder="输入装箱规格名称" />
              </el-form-item>
              <el-form-item v-if="editingId" label="状态">
                <el-select v-model="formData.status" style="width: 100%">
                  <el-option label="启用" value="ACTIVE" />
                  <el-option label="停用" value="INACTIVE" />
                </el-select>
              </el-form-item>
              <el-form-item label="长度 (cm)" prop="length">
                <el-input-number v-model="formData.length" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
              <el-form-item label="宽度 (cm)" prop="width">
                <el-input-number v-model="formData.width" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
              <el-form-item label="高度 (cm)" prop="height">
                <el-input-number v-model="formData.height" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
              <el-form-item label="重量 (kg)" prop="weight">
                <el-input-number v-model="formData.weight" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
              <el-form-item label="每箱数量" prop="quantity_per_box">
                <el-input-number v-model="formData.quantity_per_box" :min="1" :precision="0" style="width: 100%" />
              </el-form-item>
              <el-form-item label="备注" class="span-full">
                <el-input
                  v-model="formData.remark"
                  type="textarea"
                  :rows="3"
                  placeholder="输入备注"
                />
              </el-form-item>
            </div>

            <el-divider v-if="editingId" content-position="left">包材配置</el-divider>
            <div v-if="editingId" class="packaging-config-section">
              <div class="packaging-config-header">
                <div>
                  <div class="packaging-config-header__title">包材清单</div>
                  <div class="packaging-config-header__hint">维护每箱包材消耗量，供发货时自动估算。</div>
                </div>
                <el-button type="primary" :icon="Plus" size="small" @click="handleAddPackagingItem">
                  添加包材
                </el-button>
              </div>

              <el-table :data="packagingItems" border size="small" v-if="packagingItems.length > 0">
                <el-table-column type="index" label="#" width="50" />
                <el-table-column label="包材" min-width="220">
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
                        <div class="packaging-option">
                          <span>{{ item.item_name }}</span>
                          <span class="packaging-option__meta">{{ item.specification || '-' }}</span>
                        </div>
                      </el-option>
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column label="单位" width="90">
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
                      style="width: 100%"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="备注" min-width="140">
                  <template #default="{ row }">
                    <el-input v-model="row.notes" placeholder="备注" size="small" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" fixed="right">
                  <template #default="{ $index }">
                    <el-button size="small" type="danger" link @click="handleRemovePackagingItem($index)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <el-empty v-else description="暂未配置包材" :image-size="60" />
            </div>
          </el-form>
        </div>

        <aside class="dialog-aside">
          <div class="dialog-summary">
            <div class="dialog-summary__title">规格摘要</div>
            <div class="dialog-summary__item">
              <span>规格名称</span>
              <strong>{{ formData.name || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>外箱尺寸</span>
              <strong>{{ formData.length || 0 }} × {{ formData.width || 0 }} × {{ formData.height || 0 }} cm</strong>
            </div>
            <div class="dialog-summary__item">
              <span>体积</span>
              <strong>{{ currentVolume }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>每箱数量</span>
              <strong>{{ formData.quantity_per_box || 0 }} 件</strong>
            </div>
            <div class="dialog-summary__item">
              <span>包材项数</span>
              <strong>{{ packagingItems.length }}</strong>
            </div>
          </div>
        </aside>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="装箱规格详情" width="760px">
      <div v-if="currentPackageSpec" class="detail-layout">
        <section class="detail-card detail-card--main">
          <div class="detail-main__title">{{ currentPackageSpec.name }}</div>
          <div class="detail-main__meta">{{ currentPackageSpec.length }} × {{ currentPackageSpec.width }} × {{ currentPackageSpec.height }} cm</div>
          <div class="detail-tags">
            <el-tag :type="currentPackageSpec.status === 'ACTIVE' ? 'success' : 'info'">
              {{ currentPackageSpec.status === 'ACTIVE' ? '启用' : '停用' }}
            </el-tag>
            <el-tag>每箱 {{ currentPackageSpec.quantity_per_box }} 件</el-tag>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">规格参数</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>长度</span>
              <strong>{{ currentPackageSpec.length }} cm</strong>
            </div>
            <div class="detail-item">
              <span>宽度</span>
              <strong>{{ currentPackageSpec.width }} cm</strong>
            </div>
            <div class="detail-item">
              <span>高度</span>
              <strong>{{ currentPackageSpec.height }} cm</strong>
            </div>
            <div class="detail-item">
              <span>重量</span>
              <strong>{{ currentPackageSpec.weight }} kg</strong>
            </div>
            <div class="detail-item">
              <span>体积</span>
              <strong>{{ calculateVolume(currentPackageSpec) }} m³</strong>
            </div>
            <div class="detail-item">
              <span>更新时间</span>
              <strong>{{ formatTime(currentPackageSpec.gmt_modified) }}</strong>
            </div>
            <div class="detail-item">
              <span>删除状态</span>
              <strong>{{ currentPackageSpec.deletable === false ? currentPackageSpec.delete_block_reason || '不可删除' : '可删除' }}</strong>
            </div>
            <div class="detail-item">
              <span>引用数量</span>
              <strong>{{ currentPackageSpec.reference_count || 0 }}</strong>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">备注信息</div>
          <div class="detail-remark">{{ currentPackageSpec.remark || '暂无备注' }}</div>
        </section>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  createPackageSpec,
  deletePackageSpec,
  getPackageSpecList,
  getPackageSpecPackagingItems,
  savePackageSpecPackagingItems,
  updatePackageSpec
} from '../api'
import type { PackageSpec, PackageSpecPackagingItem } from '../types'
import { getPackagingItemList } from '@/modules/packaging/api'
import type { PackagingItem } from '@/modules/packaging/types'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const editingId = ref<number | null>(null)
const list = ref<PackageSpec[]>([])
const formRef = ref<FormInstance>()
const packagingItems = ref<(PackageSpecPackagingItem & { _packagingDetail?: PackagingItem })[]>([])
const availablePackagingItems = ref<PackagingItem[]>([])
const currentPackageSpec = ref<PackageSpec | null>(null)

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
  name: [{ required: true, message: '请输入规格名称', trigger: 'blur' }],
  length: [{ required: true, message: '请输入长度', trigger: 'blur' }],
  width: [{ required: true, message: '请输入宽度', trigger: 'blur' }],
  height: [{ required: true, message: '请输入高度', trigger: 'blur' }],
  weight: [{ required: true, message: '请输入重量', trigger: 'blur' }],
  quantity_per_box: [{ required: true, message: '请输入每箱数量', trigger: 'blur' }]
}


const currentVolume = computed(() => {
  const volume = (formData.length * formData.width * formData.height) / 1000000
  return `${volume.toFixed(4)} m³`
})

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

  await loadAvailablePackagingItems()
  await loadPackageSpecPackagingItems(row.id)
  dialogVisible.value = true
}

const handleView = (row: PackageSpec) => {
  currentPackageSpec.value = row
  detailVisible.value = true
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

      const validItems = packagingItems.value.filter(
        (item) => item.packaging_item_id && item.quantity_per_box > 0
      )
      await savePackageSpecPackagingItems(editingId.value, {
        packaging_items: validItems.map((item) => ({
          packaging_item_id: item.packaging_item_id,
          quantity_per_box: item.quantity_per_box,
          notes: item.notes
        }))
      })

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
  if (row.deletable === false) {
    ElMessage.warning(row.delete_block_reason || '当前装箱规格不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除装箱规格“${row.name}”吗？`, '提示', { type: 'warning' })
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

const loadPackageSpecPackagingItems = async (packageSpecId: number) => {
  try {
    const res = await getPackageSpecPackagingItems(packageSpecId)
    const items = Array.isArray(res.data) ? res.data : []
    packagingItems.value = items.map((item) => ({
      ...item,
      _packagingDetail: availablePackagingItems.value.find((packagingItem) => packagingItem.id === item.packaging_item_id)
    }))
  } catch (error: any) {
    console.error('加载装箱规格包材配置失败:', error)
    packagingItems.value = []
  }
}

const handleAddPackagingItem = () => {
  packagingItems.value.push({
    packaging_item_id: 0,
    quantity_per_box: 0,
    notes: ''
  })
}

const handleRemovePackagingItem = (index: number) => {
  packagingItems.value.splice(index, 1)
}

const handlePackagingItemSelect = (row: PackageSpecPackagingItem & { _packagingDetail?: PackagingItem }) => {
  const selected = availablePackagingItems.value.find((item) => item.id === row.packaging_item_id)
  if (selected) {
    row._packagingDetail = selected
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.package-spec-list-container {
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
}

.summary-card__label {
  font-size: 13px;
  color: #6b7280;
}

.summary-card__value {
  margin-top: 10px;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.summary-card__hint {
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.search-form {
  margin-bottom: 16px;
}

.spec-main,
.metric-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.spec-main__name {
  color: #111827;
  font-weight: 600;
}

.spec-main__meta,
.metric-block__meta {
  color: #6b7280;
  font-size: 12px;
}

.status-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-block__meta {
  color: #6b7280;
  font-size: 12px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-layout {
  display: grid;
  gap: 16px;
  margin-top: 4px;
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

.dialog-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
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
  font-size: 13px;
  color: #4b5563;
}

.dialog-summary__item:last-child {
  border-bottom: none;
}

.dialog-summary__item strong {
  color: #111827;
  text-align: right;
}

.packaging-config-section {
  margin-top: 12px;
}

.packaging-config-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.packaging-config-header__title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.packaging-config-header__hint {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
}

.packaging-option {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.packaging-option__meta {
  color: #909399;
  font-size: 12px;
}

.danger-dropdown-item {
  color: #dc2626;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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
  .package-spec-list-container {
    padding: 12px;
  }

  .summary-grid,
  .dialog-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>


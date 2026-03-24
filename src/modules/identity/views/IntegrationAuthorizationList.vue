<template>
  <div class="authorization-page">
    <el-tabs v-model="activeTab" class="integration-tabs">
      <el-tab-pane label="平台授权" name="authorization">
        <el-card shadow="never">
          <template #header>
            <div class="page-header">
              <div>
                <div class="page-title">平台授权</div>
                <div class="page-subtitle">维护平台账号授权状态、Token 到期时间和最近错误。系统每 5 分钟自动刷新一次即将过期的访问令牌。</div>
              </div>
              <div class="page-header__actions">
                <el-button @click="handleSearch">刷新</el-button>
                <el-button type="primary" @click="openStartDialog">发起授权</el-button>
              </div>
            </div>
          </template>

          <el-form :inline="true" class="search-form">
            <el-form-item label="平台">
              <el-select v-model="filters.provider_code" clearable placeholder="全部平台" style="width: 220px" @clear="handleSearch">
                <el-option
                  v-for="item in providers"
                  :key="item.code"
                  :label="item.display_name"
                  :value="item.code"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="filters.status" clearable placeholder="全部状态" style="width: 160px" @clear="handleSearch">
                <el-option label="待授权" value="PENDING" />
                <el-option label="已授权" value="AUTHORIZED" />
                <el-option label="失败" value="FAILED" />
                <el-option label="停用" value="DISABLED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table v-loading="loading" :data="rows" border stripe>
            <el-table-column label="授权账号" min-width="260">
              <template #default="{ row }">
                <div class="account-main">
                  <div class="account-main__title">{{ row.account_alias || '未命名账号' }}</div>
                  <div class="account-main__meta">
                    <span>{{ providerNameMap[row.provider_code] || row.provider_code }}</span>
                    <span>{{ row.provider_type }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="平台信息" min-width="260">
              <template #default="{ row }">
                <div class="platform-block">
                  <div>卖家ID：{{ row.seller_partner_id || '未回传' }}</div>
                  <div class="platform-block__meta">平台编码：{{ row.provider_code }}</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="状态与过期" min-width="280">
              <template #default="{ row }">
                <div class="status-block">
                  <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
                  <div class="status-block__meta">Token 到期：{{ row.access_token_expire_at || '未生成' }}</div>
                  <div class="status-block__meta">最近刷新：{{ row.last_refresh_at || '暂无记录' }}</div>
                  <div class="status-block__meta">失败次数：{{ row.refresh_fail_count ?? 0 }}</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="最近授权" width="180">
              <template #default="{ row }">{{ row.last_authorized_at || '-' }}</template>
            </el-table-column>

            <el-table-column label="操作" width="240" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="handleView(row)">查看详情</el-button>
                <el-button
                  size="small"
                  type="primary"
                  :disabled="row.status !== 'AUTHORIZED' && row.status !== 'FAILED'"
                  :loading="refreshingMap[row.id] === true"
                  @click="handleManualRefresh(row)"
                >
                  刷新 Token
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.page_size"
              :page-sizes="[10, 20, 50]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSearch"
              @current-change="loadAuthorizations"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="SKU映射" name="sku-mapping">
        <el-card shadow="never">
          <template #header>
            <div class="page-header">
              <div>
                <div class="page-title">SKU 映射台</div>
                <div class="page-subtitle">维护平台 SKU 与 ERP 产品的绑定关系。订单同步优先使用映射，未命中时回退产品主档匹配。</div>
              </div>
              <div class="page-header__actions">
                <el-button @click="loadSKUMappings">刷新</el-button>
                <el-button type="primary" @click="openCreateMappingDialog">新增映射</el-button>
              </div>
            </div>
          </template>

          <el-form :inline="true" class="search-form">
            <el-form-item label="平台">
              <el-select v-model="mappingFilters.provider_code" clearable placeholder="全部平台" style="width: 180px">
                <el-option
                  v-for="item in providers"
                  :key="item.code"
                  :label="item.display_name"
                  :value="item.code"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="站点">
              <el-select v-model="mappingFilters.marketplace" clearable placeholder="全部站点" style="width: 130px">
                <el-option v-for="item in marketplaceOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="mappingFilters.status" clearable placeholder="全部状态" style="width: 130px">
                <el-option label="启用" value="ACTIVE" />
                <el-option label="停用" value="DISABLED" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键词">
              <el-input v-model="mappingFilters.keyword" placeholder="平台SKU / 产品SKU / 标题" clearable style="width: 260px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSKUMappingSearch">查询</el-button>
              <el-button @click="handleSKUMappingReset">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table v-loading="mappingLoading" :data="mappingRows" border stripe>
            <el-table-column label="平台" width="140" prop="provider_code" />
            <el-table-column label="站点" width="100" prop="marketplace" />
            <el-table-column label="平台SKU" min-width="180" prop="seller_sku" />
            <el-table-column label="ERP产品" min-width="300">
              <template #default="{ row }">
                <div class="mapping-product">
                  <div>{{ row.product_seller_sku || '-' }}</div>
                  <div class="mapping-product__title">{{ row.product_title || `产品ID: ${row.product_id}` }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="mappingStatusTagType(row.status)">{{ mappingStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="180" prop="remark" />
            <el-table-column label="更新时间" width="180" prop="updated_at" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="openEditMappingDialog(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="mappingPagination.page"
              v-model:page-size="mappingPagination.page_size"
              :page-sizes="[10, 20, 50]"
              :total="mappingPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSKUMappingSearch"
              @current-change="loadSKUMappings"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="detailVisible" title="授权详情" width="820px">
      <div v-if="currentAuthorization" class="detail-layout">
        <section class="detail-card detail-card--main">
          <div class="detail-main">
            <div class="detail-main__title">{{ currentAuthorization.account_alias || '未命名账号' }}</div>
            <div class="detail-main__meta">{{ providerNameMap[currentAuthorization.provider_code] || currentAuthorization.provider_code }}</div>
            <div class="detail-tags">
              <el-tag :type="statusTagType(currentAuthorization.status)">
                {{ statusText(currentAuthorization.status) }}
              </el-tag>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">授权信息</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>平台编码</span>
              <strong>{{ currentAuthorization.provider_code }}</strong>
            </div>
            <div class="detail-item">
              <span>类型</span>
              <strong>{{ currentAuthorization.provider_type }}</strong>
            </div>
            <div class="detail-item detail-item--full">
              <span>卖家ID</span>
              <strong>{{ currentAuthorization.seller_partner_id || '未回传' }}</strong>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">Token 状态</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>到期时间</span>
              <strong>{{ currentAuthorization.access_token_expire_at || '未生成' }}</strong>
            </div>
            <div class="detail-item">
              <span>最近刷新</span>
              <strong>{{ currentAuthorization.last_refresh_at || '暂无记录' }}</strong>
            </div>
            <div class="detail-item">
              <span>最近授权</span>
              <strong>{{ currentAuthorization.last_authorized_at || '暂无记录' }}</strong>
            </div>
            <div class="detail-item">
              <span>刷新失败次数</span>
              <strong>{{ currentAuthorization.refresh_fail_count ?? 0 }}</strong>
            </div>
            <div class="detail-item">
              <span>最近刷新尝试</span>
              <strong>{{ currentAuthorization.last_refresh_attempt_at || '暂无记录' }}</strong>
            </div>
            <div class="detail-item">
              <span>最近刷新失败</span>
              <strong>{{ currentAuthorization.last_refresh_failed_at || '暂无记录' }}</strong>
            </div>
            <div class="detail-item detail-item--full">
              <span>最近错误</span>
              <strong>{{ currentAuthorization.last_error_message || '无' }}</strong>
            </div>
          </div>
        </section>
      </div>
    </el-dialog>

    <el-dialog v-model="startDialogVisible" title="发起平台授权" width="760px" destroy-on-close>
      <div class="dialog-layout">
        <el-form label-position="top" class="dialog-form">
          <div class="dialog-grid">
            <el-form-item label="平台" required>
              <el-select
                v-model="startForm.provider_code"
                placeholder="请选择平台"
                style="width: 100%"
              >
                <el-option
                  v-for="item in providers"
                  :key="item.code"
                  :label="item.display_name"
                  :value="item.code"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="账号别名">
              <el-input v-model="startForm.account_alias" maxlength="100" placeholder="例如：美国店主账号" />
            </el-form-item>
          </div>
        </el-form>

        <aside class="dialog-aside">
          <div class="dialog-summary">
            <div class="dialog-summary__title">授权摘要</div>
            <div class="dialog-summary__item">
              <span>平台</span>
              <strong>{{ providerNameMap[startForm.provider_code] || '未选择' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>账号别名</span>
              <strong>{{ startForm.account_alias || '未填写' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>授权提醒</span>
              <strong>确认后将打开平台授权页</strong>
            </div>
          </div>
        </aside>
      </div>

      <template #footer>
        <el-button @click="startDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="starting" @click="handleStartAuthorization">确认并授权</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="mappingDialogVisible" :title="mappingFormMode === 'create' ? '新增 SKU 映射' : '编辑 SKU 映射'" width="760px" destroy-on-close>
      <el-form label-position="top">
        <div class="dialog-grid">
          <el-form-item label="平台" required>
            <el-select v-model="mappingForm.provider_code" :disabled="mappingFormMode === 'edit'" style="width: 100%">
              <el-option
                v-for="item in providers"
                :key="item.code"
                :label="item.display_name"
                :value="item.code"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="站点" required>
            <el-select v-model="mappingForm.marketplace" :disabled="mappingFormMode === 'edit'" style="width: 100%">
              <el-option v-for="item in marketplaceOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="平台SKU" required>
            <el-input v-model="mappingForm.seller_sku" :disabled="mappingFormMode === 'edit'" maxlength="100" placeholder="请输入平台 seller_sku" />
          </el-form-item>
          <el-form-item label="ERP 产品" required>
            <el-select
              v-model="mappingForm.product_id"
              filterable
              remote
              reserve-keyword
              :remote-method="loadProductOptions"
              :loading="productSearchLoading"
              placeholder="输入 SKU 或标题搜索"
              style="width: 100%"
            >
              <el-option
                v-for="item in productOptions"
                :key="item.id"
                :label="`${item.seller_sku} / ${item.title}`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="mappingForm.status" style="width: 100%">
              <el-option label="启用" value="ACTIVE" />
              <el-option label="停用" value="DISABLED" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="mappingForm.remark" maxlength="255" placeholder="可选备注" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="mappingDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="mappingSaving" @click="handleSaveMapping">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createIntegrationSKUMapping,
  getIntegrationAuthorizationList,
  getIntegrationProviderList,
  getIntegrationSKUMappingList,
  refreshIntegrationAuthorization,
  searchProductOptions,
  startIntegrationAuthorization,
  updateIntegrationSKUMapping
} from '../api/system'
import type {
  IntegrationAuthorization,
  IntegrationAuthorizationStatus,
  IntegrationProviderSummary,
  IntegrationSKUMapping,
  IntegrationSKUMappingStatus
} from '../types'

const activeTab = ref<'authorization' | 'sku-mapping'>('authorization')
const loading = ref(false)
const starting = ref(false)
const startDialogVisible = ref(false)
const detailVisible = ref(false)

const providers = ref<IntegrationProviderSummary[]>([])
const rows = ref<IntegrationAuthorization[]>([])
const currentAuthorization = ref<IntegrationAuthorization | null>(null)
const refreshingMap = reactive<Record<number, boolean>>({})

const filters = reactive({
  provider_code: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const startForm = reactive({
  provider_code: '',
  account_alias: ''
})

const mappingLoading = ref(false)
const mappingSaving = ref(false)
const mappingDialogVisible = ref(false)
const mappingFormMode = ref<'create' | 'edit'>('create')
const mappingRows = ref<IntegrationSKUMapping[]>([])
const mappingFilters = reactive({
  provider_code: '',
  marketplace: '',
  status: '',
  keyword: ''
})
const mappingPagination = reactive({
  page: 1,
  page_size: 10,
  total: 0
})
const mappingForm = reactive({
  id: 0,
  provider_code: '',
  marketplace: 'US',
  seller_sku: '',
  product_id: 0,
  status: 'ACTIVE' as IntegrationSKUMappingStatus,
  remark: ''
})
const productOptions = ref<Array<{ id: number; seller_sku: string; title: string; marketplace: string }>>([])
const productSearchLoading = ref(false)
const marketplaceOptions = ['US', 'CA', 'AU', 'UK', 'DE', 'JP']

const providerNameMap = computed<Record<string, string>>(() => (
  providers.value.reduce<Record<string, string>>((acc, item) => {
    acc[item.code] = item.display_name
    return acc
  }, {})
))

const loadProviders = async () => {
  const res = await getIntegrationProviderList()
  providers.value = res.data || []
}

const loadAuthorizations = async () => {
  loading.value = true
  try {
    const res = await getIntegrationAuthorizationList({
      page: pagination.page,
      page_size: pagination.page_size,
      provider_code: filters.provider_code || undefined,
      status: filters.status || undefined
    })
    rows.value = res.data.data || []
    pagination.total = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadAuthorizations()
}

const handleReset = () => {
  filters.provider_code = ''
  filters.status = ''
  handleSearch()
}

const openStartDialog = () => {
  if (!providers.value.length) {
    ElMessage.warning('暂无可用授权平台，请先配置 integrations.json 并启用提供方')
    return
  }
  startForm.provider_code = providers.value[0].code
  startForm.account_alias = ''
  startDialogVisible.value = true
}

const handleView = (row: IntegrationAuthorization) => {
  currentAuthorization.value = row
  detailVisible.value = true
}

const handleStartAuthorization = async () => {
  if (!startForm.provider_code) {
    ElMessage.warning('请选择平台')
    return
  }
  starting.value = true
  try {
    const res = await startIntegrationAuthorization({
      provider_code: startForm.provider_code,
      account_alias: startForm.account_alias || undefined
    })
    const popup = openOAuthPopup(res.data.authorize_url)
    if (!popup) {
      ElMessage.error('浏览器拦截了授权窗口，请允许弹窗后重试')
      return
    }
    startDialogVisible.value = false
    ElMessage.success('授权窗口已打开，请在平台页面完成确认')
    await loadAuthorizations()
  } finally {
    starting.value = false
  }
}

const openOAuthPopup = (url: string) => {
  const width = 980
  const height = 760
  const left = Math.max((window.screen.width - width) / 2, 0)
  const top = Math.max((window.screen.height - height) / 2, 0)
  const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  return window.open(url, 'integration-oauth', features)
}

const handleOAuthMessage = (event: MessageEvent) => {
  if (!event || !event.data || typeof event.data !== 'object') {
    return
  }
  const payload = event.data as {
    type?: string
    success?: boolean
    message?: string
  }
  if (payload.type !== 'integration-oauth-callback') {
    return
  }
  if (payload.success) {
    ElMessage.success(payload.message || '平台授权成功')
  } else {
    ElMessage.error(payload.message || '平台授权失败')
  }
  loadAuthorizations()
}

const handleManualRefresh = async (row: IntegrationAuthorization) => {
  refreshingMap[row.id] = true
  try {
    await refreshIntegrationAuthorization(row.id)
    ElMessage.success('Token 刷新成功')
    await loadAuthorizations()
  } finally {
    refreshingMap[row.id] = false
  }
}

const statusText = (status: IntegrationAuthorizationStatus) => {
  if (status === 'PENDING') return '待授权'
  if (status === 'AUTHORIZED') return '已授权'
  if (status === 'FAILED') return '失败'
  if (status === 'DISABLED') return '停用'
  return status
}

const statusTagType = (status: IntegrationAuthorizationStatus) => {
  if (status === 'AUTHORIZED') return 'success'
  if (status === 'FAILED') return 'danger'
  if (status === 'PENDING') return 'warning'
  return 'info'
}

const loadSKUMappings = async () => {
  mappingLoading.value = true
  try {
    const res = await getIntegrationSKUMappingList({
      page: mappingPagination.page,
      page_size: mappingPagination.page_size,
      provider_code: mappingFilters.provider_code || undefined,
      marketplace: mappingFilters.marketplace || undefined,
      status: mappingFilters.status as IntegrationSKUMappingStatus || undefined,
      keyword: mappingFilters.keyword || undefined
    })
    mappingRows.value = res.data.data || []
    mappingPagination.total = res.data.total || 0
  } finally {
    mappingLoading.value = false
  }
}

const handleSKUMappingSearch = () => {
  mappingPagination.page = 1
  loadSKUMappings()
}

const handleSKUMappingReset = () => {
  mappingFilters.provider_code = ''
  mappingFilters.marketplace = ''
  mappingFilters.status = ''
  mappingFilters.keyword = ''
  handleSKUMappingSearch()
}

const resetMappingForm = () => {
  mappingForm.id = 0
  mappingForm.provider_code = providers.value[0]?.code || ''
  mappingForm.marketplace = 'US'
  mappingForm.seller_sku = ''
  mappingForm.product_id = 0
  mappingForm.status = 'ACTIVE'
  mappingForm.remark = ''
  productOptions.value = []
}

const openCreateMappingDialog = () => {
  mappingFormMode.value = 'create'
  resetMappingForm()
  mappingDialogVisible.value = true
}

const openEditMappingDialog = (row: IntegrationSKUMapping) => {
  mappingFormMode.value = 'edit'
  mappingForm.id = row.id
  mappingForm.provider_code = row.provider_code
  mappingForm.marketplace = row.marketplace
  mappingForm.seller_sku = row.seller_sku
  mappingForm.product_id = row.product_id
  mappingForm.status = row.status
  mappingForm.remark = row.remark || ''
  productOptions.value = [{
    id: row.product_id,
    seller_sku: row.product_seller_sku || '',
    title: row.product_title || `产品ID:${row.product_id}`,
    marketplace: row.marketplace
  }]
  mappingDialogVisible.value = true
}

const loadProductOptions = async (keyword: string) => {
  if (!keyword || !keyword.trim()) {
    return
  }
  productSearchLoading.value = true
  try {
    const res = await searchProductOptions(keyword.trim())
    productOptions.value = res.data.data || []
  } finally {
    productSearchLoading.value = false
  }
}

const handleSaveMapping = async () => {
  if (!mappingForm.provider_code) {
    ElMessage.warning('请选择平台')
    return
  }
  if (!mappingForm.marketplace) {
    ElMessage.warning('请选择站点')
    return
  }
  if (!mappingForm.seller_sku.trim()) {
    ElMessage.warning('请输入平台SKU')
    return
  }
  if (!mappingForm.product_id) {
    ElMessage.warning('请选择ERP产品')
    return
  }

  mappingSaving.value = true
  try {
    if (mappingFormMode.value === 'create') {
      await createIntegrationSKUMapping({
        provider_code: mappingForm.provider_code,
        marketplace: mappingForm.marketplace,
        seller_sku: mappingForm.seller_sku.trim(),
        product_id: mappingForm.product_id,
        status: mappingForm.status,
        remark: mappingForm.remark || undefined
      })
      ElMessage.success('新增映射成功')
    } else {
      await updateIntegrationSKUMapping(mappingForm.id, {
        product_id: mappingForm.product_id,
        status: mappingForm.status,
        remark: mappingForm.remark || undefined
      })
      ElMessage.success('更新映射成功')
    }
    mappingDialogVisible.value = false
    await loadSKUMappings()
  } finally {
    mappingSaving.value = false
  }
}

const mappingStatusText = (status: IntegrationSKUMappingStatus) => {
  if (status === 'ACTIVE') return '启用'
  return '停用'
}

const mappingStatusTagType = (status: IntegrationSKUMappingStatus) => {
  if (status === 'ACTIVE') return 'success'
  return 'info'
}

watch(activeTab, async (tab) => {
  if (tab === 'sku-mapping' && mappingRows.value.length === 0) {
    await loadSKUMappings()
  }
})

onMounted(async () => {
  window.addEventListener('message', handleOAuthMessage)
  await loadProviders()
  await loadAuthorizations()
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleOAuthMessage)
})
</script>

<style scoped>
.authorization-page {
  width: 100%;
}

.integration-tabs {
  width: 100%;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-header__actions {
  display: flex;
  gap: 8px;
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
  margin-bottom: 16px;
}

.account-main__title,
.detail-main__title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.account-main__meta,
.platform-block__meta,
.status-block__meta,
.detail-main__meta {
  margin-top: 4px;
  color: #6b7280;
  font-size: 13px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.platform-block,
.status-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mapping-product {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mapping-product__title {
  color: #6b7280;
  font-size: 13px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px 20px;
  background: #fff;
}

.detail-card--main {
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
}

.detail-tags {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.detail-card__title,
.dialog-summary__title {
  margin-bottom: 14px;
  font-weight: 600;
  color: #111827;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item span,
.dialog-summary__item span {
  color: #6b7280;
  font-size: 13px;
}

.detail-item strong,
.dialog-summary__item strong {
  color: #111827;
  font-size: 14px;
  line-height: 1.6;
}

.detail-item--full {
  grid-column: 1 / -1;
}

.dialog-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 20px;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 16px;
}

.dialog-aside {
  border-left: 1px solid #e5e7eb;
  padding-left: 20px;
}

.dialog-summary {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px;
  background: #f8fafc;
}

.dialog-summary__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 0;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-summary__item:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

@media (max-width: 1200px) {
  .dialog-layout {
    grid-template-columns: 1fr;
  }

  .dialog-aside {
    border-left: 0;
    padding-left: 0;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .detail-grid,
  .dialog-grid {
    grid-template-columns: 1fr;
  }
}
</style>

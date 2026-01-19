<template>
  <div class="dashboard-container">
    <section class="hero">
      <div class="hero-content">
        <p class="hero-kicker">Operational Pulse</p>
        <h1>
          {{ authStore.user?.real_name || authStore.user?.username || 'Operator' }}
          ，今天的业务概览
        </h1>
        <p class="hero-subtitle">聚焦库存、采购、发货、财务关键指标，随时掌控节奏。</p>
        <div class="hero-chips">
          <span class="chip">
            <el-icon><Clock /></el-icon>
            {{ todayLabel }}
          </span>
          <span class="chip">
            <el-icon><CircleCheckFilled /></el-icon>
            {{ isOnline ? 'Online' : 'Offline' }}
          </span>
          <span class="chip">
            <el-icon><Menu /></el-icon>
            Modules {{ menuStore.menus.length }}
          </span>
        </div>
      </div>
      <div class="hero-panel">
        <div class="hero-metric">
          <span class="label">Active Modules</span>
          <span class="value">{{ menuStore.menus.length }}</span>
        </div>
        <div class="hero-metric">
          <span class="label">Roles</span>
          <span class="value">{{ authStore.roles.length }}</span>
        </div>
        <div class="hero-metric">
          <span class="label">Permissions</span>
          <span class="value">{{ authStore.permissions.length }}</span>
        </div>
      </div>
    </section>

    <section class="kpi-grid">
      <div v-for="card in kpiCards" :key="card.title" class="kpi-card" :class="card.tone">
        <div class="kpi-header">
          <span>{{ card.title }}</span>
          <el-icon><component :is="card.icon" /></el-icon>
        </div>
        <div class="kpi-value">
          <span class="number">{{ card.value }}</span>
          <span class="unit" v-if="card.unit">{{ card.unit }}</span>
        </div>
        <div class="kpi-footer">
          <span class="delta" :class="card.deltaTone">{{ card.delta }}</span>
          <span class="delta-label">{{ card.deltaLabel }}</span>
        </div>
      </div>
    </section>

    <section class="grid-panels">
      <el-card shadow="hover" class="panel">
        <template #header>
          <div class="panel-title">
            <span>Operations Radar</span>
            <el-tag type="info" effect="plain">今日</el-tag>
          </div>
        </template>
        <div class="radar-list">
          <div class="radar-item" v-for="item in radarItems" :key="item.label">
            <div>
              <p class="radar-label">{{ item.label }}</p>
              <p class="radar-desc">{{ item.desc }}</p>
            </div>
            <div class="radar-value">
              <span>{{ item.value }}</span>
              <el-progress :percentage="item.progress" :status="item.status" :stroke-width="8" />
            </div>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="panel">
        <template #header>
          <div class="panel-title">
            <span>Module Map</span>
            <el-button link type="primary" @click="router.push('/system/settings')">
              系统配置
            </el-button>
          </div>
        </template>
        <div class="module-grid">
          <div v-for="menu in topMenus" :key="menu.id" class="module-chip">
            <span>{{ menu.title || menu.name }}</span>
          </div>
          <div v-if="topMenus.length === 0" class="module-empty">
            <el-empty description="暂无可用模块" :image-size="80" />
          </div>
        </div>
      </el-card>
    </section>

    <section class="grid-panels">
      <el-card shadow="hover" class="panel">
        <template #header>
          <div class="panel-title">
            <span>Key Roles</span>
          </div>
        </template>
        <div class="role-list">
          <el-tag
            v-for="role in authStore.roles"
            :key="role.id"
            type="success"
            size="large"
            effect="plain"
            class="role-tag"
          >
            <el-icon><Avatar /></el-icon>
            {{ role.display_name }}
          </el-tag>
          <el-empty v-if="authStore.roles.length === 0" description="No roles assigned" :image-size="90" />
        </div>
      </el-card>

      <el-card shadow="hover" class="panel">
        <template #header>
          <div class="panel-title">
            <span>Quick Actions</span>
          </div>
        </template>
        <div class="quick-actions">
          <el-button type="primary" @click="router.push('/inventory/warehouses')" :icon="House">
            仓库管理
          </el-button>
          <el-button type="warning" @click="router.push('/procurement/purchase-orders')" :icon="List">
            采购单
          </el-button>
          <el-button type="success" @click="router.push('/shipping/shipments')" :icon="Van">
            发货单
          </el-button>
          <el-button type="info" @click="router.push('/finance/cash-ledger')" :icon="Coin">
            现金流水
          </el-button>
        </div>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/identity/stores/authStore'
import { useMenuStore } from '@/modules/identity/stores/menuStore'
import {
  Menu,
  Clock,
  CircleCheckFilled,
  Box,
  WarningFilled,
  Money,
  Avatar,
  House,
  List,
  Van,
  Coin
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const menuStore = useMenuStore()

const todayLabel = new Date().toLocaleDateString()
const isOnline = navigator.onLine

const kpiCards = [
  {
    title: '库存预警 SKU',
    value: 0,
    unit: '',
    delta: '0',
    deltaLabel: 'vs yesterday',
    tone: 'tone-orange',
    deltaTone: 'neutral',
    icon: WarningFilled
  },
  {
    title: '采购待确认',
    value: 0,
    unit: '',
    delta: '0',
    deltaLabel: 'pending',
    tone: 'tone-blue',
    deltaTone: 'neutral',
    icon: Box
  },
  {
    title: '发货待处理',
    value: 0,
    unit: '',
    delta: '0',
    deltaLabel: 'processing',
    tone: 'tone-green',
    deltaTone: 'neutral',
    icon: Van
  },
  {
    title: '未对账流水',
    value: 0,
    unit: '',
    delta: '0',
    deltaLabel: 'unreconciled',
    tone: 'tone-olive',
    deltaTone: 'neutral',
    icon: Money
  }
]

const radarItems = [
  { label: '库存周转', desc: '近 7 天出入库节奏', value: '稳定', progress: 72, status: 'success' },
  { label: '采购节拍', desc: '待下单与已发货', value: '偏慢', progress: 46, status: 'warning' },
  { label: '发货达成', desc: '头程与入库完成度', value: '良好', progress: 78, status: 'success' },
  { label: '资金健康度', desc: '现金流水与成本快照', value: '正常', progress: 64, status: 'success' }
]

const topMenus = computed(() => menuStore.menus.slice(0, 8))

onMounted(() => {
  menuStore.loadMenus()
})
</script>

<style scoped>
.dashboard-container {
  width: 100%;
  padding: 24px;
  font-family: "IBM Plex Sans", "Noto Sans SC", "Microsoft YaHei", sans-serif;
  background: radial-gradient(circle at top left, rgba(240, 244, 255, 0.8), transparent 45%),
    radial-gradient(circle at 80% 20%, rgba(246, 240, 232, 0.8), transparent 40%),
    #f7f7f3;
}

.hero {
  display: grid;
  grid-template-columns: 1.4fr 0.6fr;
  gap: 20px;
  padding: 28px;
  border-radius: 18px;
  background: linear-gradient(135deg, #0f2027 0%, #203a43 45%, #2c5364 100%);
  color: #f9fafb;
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;
}

.hero::after {
  content: '';
  position: absolute;
  width: 320px;
  height: 320px;
  right: -80px;
  top: -120px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 65%);
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-kicker {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 12px;
  opacity: 0.7;
}

.hero h1 {
  margin: 0 0 10px;
  font-size: 28px;
  font-weight: 700;
}

.hero-subtitle {
  margin: 0 0 16px;
  font-size: 14px;
  opacity: 0.85;
  max-width: 520px;
}

.hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 12px;
}

.hero-panel {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 14px;
  z-index: 1;
}

.hero-metric {
  background: rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-metric .label {
  font-size: 12px;
  opacity: 0.7;
}

.hero-metric .value {
  font-size: 22px;
  font-weight: 600;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  padding: 16px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
}

.kpi-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.kpi-value .number {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.kpi-value .unit {
  font-size: 13px;
  color: #9ca3af;
}

.kpi-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.delta {
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}

.delta.neutral {
  background: rgba(15, 23, 42, 0.06);
  color: #374151;
}

.tone-orange {
  border-left: 4px solid #f59e0b;
}

.tone-blue {
  border-left: 4px solid #3b82f6;
}

.tone-green {
  border-left: 4px solid #10b981;
}

.tone-olive {
  border-left: 4px solid #6b7280;
}

.grid-panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.panel {
  border-radius: 16px;
  overflow: hidden;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.radar-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.radar-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.radar-label {
  margin: 0;
  font-weight: 600;
  color: #111827;
}

.radar-desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.radar-value {
  min-width: 160px;
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #374151;
}

.module-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.module-chip {
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.05);
  font-size: 12px;
  color: #374151;
}

.module-empty {
  width: 100%;
}

.role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.role-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 14px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.quick-actions .el-button {
  width: 100%;
  justify-content: flex-start;
}

@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grid-panels {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>

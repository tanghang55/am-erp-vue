<template>
  <div class="system-monitor-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">系统监控</div>
            <div class="page-subtitle">集中查看系统健康状态、重要提醒、后台任务与运行日志。</div>
          </div>
          <div class="header-actions">
            <div class="header-meta">最近刷新：{{ formatDateTime(overview?.generated_at) }}</div>
            <el-button type="primary" :loading="loadingOverview || loadingJobs || loadingLogs" @click="handleRefresh">
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <div class="summary-grid">
        <article
          v-for="card in summaryCards"
          :key="card.label"
          class="summary-card"
          :class="card.statusClass"
          data-testid="system-monitor-summary-card"
        >
          <span class="summary-label">{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <p>{{ card.hint }}</p>
        </article>
      </div>

      <div class="overview-layout">
        <section class="section-card signal-section">
          <div class="section-head">
            <div class="section-heading">
              <div class="section-title">核心信号</div>
              <div class="section-subtitle">先看系统总状态、基础设施和待处理提醒。</div>
            </div>
          </div>

          <div class="signal-grid">
            <article class="signal-card" :class="statusClass(overview?.database.status)">
              <div class="signal-card__head">
                <strong>数据库连接</strong>
                <el-tag :type="statusTagType(overview?.database.status)" effect="light">
                  {{ statusText(overview?.database.status) }}
                </el-tag>
              </div>
              <div class="signal-card__message">{{ overview?.database.message || '暂无数据' }}</div>
            </article>

            <article class="signal-card" :class="statusClass(overview?.migrations.status)">
              <div class="signal-card__head">
                <strong>迁移状态</strong>
                <el-tag :type="statusTagType(overview?.migrations.status)" effect="light">
                  {{ statusText(overview?.migrations.status) }}
                </el-tag>
              </div>
              <div class="signal-card__message">{{ overview?.migrations.message || '暂无数据' }}</div>
              <div class="signal-card__meta">待执行 {{ overview?.migrations.pending_count || 0 }} 条</div>
            </article>
          </div>

          <div class="alert-panel" :class="{ 'is-empty': !overview?.alerts.length }">
            <div class="alert-panel__head">
              <div class="section-title section-title--small">重点提醒</div>
              <el-tag :type="overview?.alerts.length ? 'warning' : 'success'" effect="light">
                {{ overview?.alerts.length ? `${overview?.alerts.length} 项待处理` : '当前无异常提醒' }}
              </el-tag>
            </div>
            <div v-if="overview?.alerts.length" class="alert-list">
              <div v-for="(alert, index) in overview.alerts" :key="`${index}-${alert}`" class="alert-item">
                {{ alert }}
              </div>
            </div>
            <div v-else class="alert-empty">当前没有需要处理的告警或预警。</div>
          </div>
        </section>

        <section class="section-card task-section">
          <div class="section-head">
            <div class="section-heading">
              <div class="section-title">任务状态</div>
              <div class="section-subtitle">查看关键后台任务最近一次执行和当前口径。</div>
            </div>
          </div>
          <div class="task-grid">
            <article v-for="task in overview?.tasks || []" :key="task.name" class="task-card">
              <div class="task-head">
                <strong>{{ task.name }}</strong>
                <el-tag :type="statusTagType(task.status)" effect="dark">{{ statusText(task.status) }}</el-tag>
              </div>
              <div class="task-meta">
                <span>最近状态：{{ task.last_status || '暂无' }}</span>
                <span>最近执行：{{ formatDateTime(task.last_run_at) }}</span>
              </div>
              <p class="task-message">{{ task.message || '运行正常' }}</p>
            </article>
          </div>
        </section>
      </div>

      <div class="workspace-grid">
        <section class="section-card job-section">
          <div class="section-head">
            <div class="section-heading">
              <div class="section-title">最近任务</div>
              <div class="section-subtitle">优先关注失败任务，再顺着 Trace 查看关联日志。</div>
              <div v-if="activeTraceId" class="trace-filter">
                <span>当前 Trace：{{ activeTraceId }}</span>
                <el-button link type="primary" @click="clearTraceFilter">清除</el-button>
              </div>
            </div>
            <div class="job-filters">
              <el-button :type="jobStatus === 'FAILED' ? 'danger' : 'default'" plain @click="toggleFailedJobs">
                {{ jobStatus === 'FAILED' ? '查看全部任务' : `只看失败任务 (${failedJobCount})` }}
              </el-button>
              <el-select v-model="jobStatus" clearable placeholder="全部状态" style="width: 140px" @change="loadJobs">
                <el-option label="全部状态" value="" />
                <el-option label="成功" value="SUCCESS" />
                <el-option label="失败" value="FAILED" />
                <el-option label="运行中" value="RUNNING" />
              </el-select>
              <el-select v-model="jobLimit" style="width: 120px" @change="loadJobs">
                <el-option :value="10" label="10 条" />
                <el-option :value="20" label="20 条" />
                <el-option :value="30" label="30 条" />
              </el-select>
            </div>
          </div>

          <el-table v-loading="loadingJobs" :data="jobs" border stripe class="job-table" :row-class-name="jobRowClassName">
            <el-table-column prop="job_name" label="任务名称" min-width="220" />
            <el-table-column prop="job_type" label="任务类型" min-width="150" />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="jobStatusTagType(row.status)" effect="light">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="耗时" width="110">
              <template #default="{ row }">{{ formatDuration(row.duration_ms) }}</template>
            </el-table-column>
            <el-table-column label="执行时间" width="180">
              <template #default="{ row }">{{ formatDateTime(row.started_at || row.gmt_create) }}</template>
            </el-table-column>
            <el-table-column label="Trace ID" min-width="180">
              <template #default="{ row }">
                <el-button
                  v-if="row.trace_id"
                  link
                  type="primary"
                  class="trace-link"
                  @click="applyTraceFilter(row.trace_id)"
                >
                  {{ row.trace_id }}
                </el-button>
                <span v-else class="trace-id">-</span>
              </template>
            </el-table-column>
            <el-table-column label="结果摘要" min-width="320">
              <template #default="{ row }">
                <div class="job-summary">
                  <span v-if="row.total_rows !== undefined">总数 {{ row.total_rows ?? 0 }}</span>
                  <span v-if="row.success_rows !== undefined">成功 {{ row.success_rows ?? 0 }}</span>
                  <span v-if="row.failed_rows !== undefined">失败 {{ row.failed_rows ?? 0 }}</span>
                  <span v-if="row.error_message" class="job-error">{{ summarizeText(row.error_message, 80) }}</span>
                  <span v-else-if="row.total_rows === undefined && row.success_rows === undefined">无额外摘要</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openJobDetail(row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>

        <section class="section-card log-section">
          <div class="section-head">
            <div class="section-heading">
              <div class="section-title">最近系统日志</div>
              <div class="section-subtitle">看错误、警告和异常上下文，必要时复制 Trace 继续排障。</div>
              <div v-if="activeTraceId" class="trace-filter">
                <span>按同一 Trace 联动过滤中</span>
              </div>
            </div>
            <div class="job-filters">
              <el-button :type="logLevel === 'ERROR' ? 'danger' : 'default'" plain @click="toggleErrorLogs">
                {{ logLevel === 'ERROR' ? '查看全部日志' : `只看错误日志 (${errorLogCount})` }}
              </el-button>
              <el-select v-model="logLevel" clearable placeholder="全部级别" style="width: 140px" @change="loadLogs">
                <el-option label="全部级别" value="" />
                <el-option label="错误" value="ERROR" />
                <el-option label="警告" value="WARN" />
                <el-option label="信息" value="INFO" />
              </el-select>
              <el-select v-model="logLimit" style="width: 120px" @change="loadLogs">
                <el-option :value="10" label="10 条" />
                <el-option :value="20" label="20 条" />
                <el-option :value="30" label="30 条" />
              </el-select>
            </div>
          </div>

          <el-table v-loading="loadingLogs" :data="logs" border stripe class="job-table" :row-class-name="logRowClassName">
            <el-table-column label="时间" width="180">
              <template #default="{ row }">{{ formatDateTime(row.gmt_create) }}</template>
            </el-table-column>
            <el-table-column label="级别" width="110">
              <template #default="{ row }">
                <el-tag :type="logLevelTagType(row.level)" effect="light">{{ row.level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="module" label="模块" width="160" />
            <el-table-column label="日志内容" min-width="360">
              <template #default="{ row }">
                <div class="log-message-cell">
                  <div class="log-message-main">{{ summarizeText(row.message, 90) }}</div>
                  <div v-if="row.exception" class="log-exception">{{ summarizeText(row.exception, 80) }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="Trace ID" min-width="180">
              <template #default="{ row }">
                <el-button
                  v-if="row.trace_id"
                  link
                  type="primary"
                  class="trace-link"
                  @click="applyTraceFilter(row.trace_id)"
                >
                  {{ row.trace_id }}
                </el-button>
                <span v-else class="trace-id">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openLogDetail(row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </div>
    </el-card>

    <el-dialog v-model="logDetailVisible" title="系统日志详情" width="860px" destroy-on-close>
      <template v-if="selectedLog">
        <div class="log-detail-grid">
          <div class="log-detail-item">
            <span class="log-detail-label">时间</span>
            <strong>{{ formatDateTime(selectedLog.gmt_create) }}</strong>
          </div>
          <div class="log-detail-item">
            <span class="log-detail-label">级别</span>
            <strong>{{ selectedLog.level }}</strong>
          </div>
          <div class="log-detail-item">
            <span class="log-detail-label">模块</span>
            <strong>{{ selectedLog.module || '-' }}</strong>
          </div>
          <div class="log-detail-item">
            <span class="log-detail-label">Trace ID</span>
            <strong class="trace-id">{{ selectedLog.trace_id || '-' }}</strong>
          </div>
        </div>

        <div class="log-detail-actions">
          <el-button
            v-if="selectedLog.trace_id"
            type="primary"
            plain
            @click="copyText(selectedLog.trace_id, 'Trace ID 已复制')"
          >
            复制 Trace ID
          </el-button>
          <el-button @click="copySelectedLogContent">复制日志内容</el-button>
        </div>

        <div class="log-detail-block">
          <div class="log-detail-title">消息内容</div>
          <pre class="log-detail-pre">{{ selectedLog.message || '-' }}</pre>
        </div>

        <div v-if="selectedLog.exception" class="log-detail-block">
          <div class="log-detail-title">异常信息</div>
          <pre class="log-detail-pre is-error">{{ selectedLog.exception }}</pre>
        </div>

        <div v-if="selectedLog.context" class="log-detail-block">
          <div class="log-detail-title">上下文</div>
          <pre class="log-detail-pre">{{ formatLogContext(selectedLog.context) }}</pre>
        </div>
      </template>
      <template #footer>
        <el-button @click="logDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="jobDetailVisible" title="任务详情" width="860px" destroy-on-close>
      <template v-if="selectedJob">
        <div class="log-detail-grid">
          <div class="log-detail-item">
            <span class="log-detail-label">任务名称</span>
            <strong>{{ selectedJob.job_name }}</strong>
          </div>
          <div class="log-detail-item">
            <span class="log-detail-label">任务类型</span>
            <strong>{{ selectedJob.job_type }}</strong>
          </div>
          <div class="log-detail-item">
            <span class="log-detail-label">状态</span>
            <strong>{{ selectedJob.status }}</strong>
          </div>
          <div class="log-detail-item">
            <span class="log-detail-label">Trace ID</span>
            <strong class="trace-id">{{ selectedJob.trace_id || '-' }}</strong>
          </div>
          <div class="log-detail-item">
            <span class="log-detail-label">开始时间</span>
            <strong>{{ formatDateTime(selectedJob.started_at || selectedJob.gmt_create) }}</strong>
          </div>
          <div class="log-detail-item">
            <span class="log-detail-label">结束时间</span>
            <strong>{{ formatDateTime(selectedJob.finished_at) }}</strong>
          </div>
          <div class="log-detail-item">
            <span class="log-detail-label">耗时</span>
            <strong>{{ formatDuration(selectedJob.duration_ms) }}</strong>
          </div>
          <div class="log-detail-item">
            <span class="log-detail-label">结果统计</span>
            <strong>
              总数 {{ selectedJob.total_rows ?? 0 }} / 成功 {{ selectedJob.success_rows ?? 0 }} / 失败 {{ selectedJob.failed_rows ?? 0 }}
            </strong>
          </div>
        </div>

        <div class="log-detail-actions">
          <el-button
            v-if="selectedJob.trace_id"
            type="primary"
            plain
            @click="copyText(selectedJob.trace_id, 'Trace ID 已复制')"
          >
            复制 Trace ID
          </el-button>
          <el-button @click="copySelectedJobContent">复制任务内容</el-button>
        </div>

        <div class="log-detail-block">
          <div class="log-detail-title">结果摘要</div>
          <pre class="log-detail-pre">{{ buildJobDetailContent(selectedJob) }}</pre>
        </div>

        <div v-if="selectedJob.error_message" class="log-detail-block">
          <div class="log-detail-title">错误信息</div>
          <pre class="log-detail-pre is-error">{{ selectedJob.error_message }}</pre>
        </div>
      </template>
      <template #footer>
        <el-button @click="jobDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getMonitorOverview, getRecentMonitorJobs, getRecentMonitorLogs } from '../api'
import type { MonitorOverview, MonitorRecentJob, MonitorRecentLog, MonitorStatus } from '../types'

const loadingOverview = ref(false)
const loadingJobs = ref(false)
const loadingLogs = ref(false)
const overview = ref<MonitorOverview | null>(null)
const jobs = ref<MonitorRecentJob[]>([])
const logs = ref<MonitorRecentLog[]>([])
const jobStatus = ref('')
const jobLimit = ref(10)
const logLevel = ref('')
const logLimit = ref(10)
const activeTraceId = ref('')
const logDetailVisible = ref(false)
const selectedLog = ref<MonitorRecentLog | null>(null)
const jobDetailVisible = ref(false)
const selectedJob = ref<MonitorRecentJob | null>(null)

const failedJobCount = computed(() => jobs.value.filter((item) => item.status === 'FAILED').length)
const errorLogCount = computed(() => logs.value.filter((item) => item.level === 'ERROR').length)

const overviewSummary = computed(() => {
  if (!overview.value) return '监控数据加载中'
  if (overview.value.alerts.length === 0) return '当前没有异常提醒'
  return overview.value.alerts[0]
})

const alertSummary = computed(() => {
  if (!overview.value || overview.value.alerts.length === 0) return '当前没有需要处理的提醒'
  return overview.value.alerts.join('；')
})

const summaryCards = computed(() => [
  {
    label: '系统总状态',
    value: statusText(overview.value?.overall_status),
    hint: overviewSummary.value,
    statusClass: statusClass(overview.value?.overall_status)
  },
  {
    label: '数据库连接',
    value: statusText(overview.value?.database.status),
    hint: overview.value?.database.message || '暂无数据',
    statusClass: statusClass(overview.value?.database.status)
  },
  {
    label: '待执行迁移',
    value: String(overview.value?.migrations.pending_count || 0),
    hint: overview.value?.migrations.message || '暂无数据',
    statusClass: statusClass(overview.value?.migrations.status)
  },
  {
    label: '重要提醒',
    value: String(overview.value?.alerts.length || 0),
    hint: alertSummary.value,
    statusClass: overview.value?.alerts.length ? 'warn' : 'ok'
  }
])

const loadOverview = async () => {
  loadingOverview.value = true
  try {
    const res = await getMonitorOverview()
    if (res.success) {
      overview.value = res.data
    }
  } finally {
    loadingOverview.value = false
  }
}

const loadJobs = async () => {
  loadingJobs.value = true
  try {
    const res = await getRecentMonitorJobs({
      status: jobStatus.value || undefined,
      trace_id: activeTraceId.value || undefined,
      limit: jobLimit.value
    })
    if (res.success) {
      jobs.value = res.data
    }
  } finally {
    loadingJobs.value = false
  }
}

const loadLogs = async () => {
  loadingLogs.value = true
  try {
    const res = await getRecentMonitorLogs({
      level: logLevel.value || undefined,
      trace_id: activeTraceId.value || undefined,
      limit: logLimit.value
    })
    if (res.success) {
      logs.value = res.data
    }
  } finally {
    loadingLogs.value = false
  }
}

const handleRefresh = async () => {
  try {
    await Promise.all([loadOverview(), loadJobs(), loadLogs()])
    ElMessage.success('监控数据已刷新')
  } catch (error: any) {
    if (!error?._handled) {
      ElMessage.error(error?.message || '刷新失败')
    }
  }
}

const applyTraceFilter = async (traceId?: string) => {
  if (!traceId) return
  activeTraceId.value = traceId
  await Promise.all([loadJobs(), loadLogs()])
}

const clearTraceFilter = async () => {
  activeTraceId.value = ''
  await Promise.all([loadJobs(), loadLogs()])
}

const toggleFailedJobs = async () => {
  jobStatus.value = jobStatus.value === 'FAILED' ? '' : 'FAILED'
  await loadJobs()
}

const toggleErrorLogs = async () => {
  logLevel.value = logLevel.value === 'ERROR' ? '' : 'ERROR'
  await loadLogs()
}

const openLogDetail = (log: MonitorRecentLog) => {
  selectedLog.value = log
  logDetailVisible.value = true
}

const openJobDetail = (job: MonitorRecentJob) => {
  selectedJob.value = job
  jobDetailVisible.value = true
}

const statusText = (status?: MonitorStatus) => {
  if (status === 'OK') return '正常'
  if (status === 'WARN') return '预警'
  if (status === 'ERROR') return '异常'
  return '未知'
}

const statusClass = (status?: MonitorStatus) => {
  if (status === 'ERROR') return 'error'
  if (status === 'WARN') return 'warn'
  return 'ok'
}

const statusTagType = (status?: MonitorStatus) => {
  if (status === 'ERROR') return 'danger'
  if (status === 'WARN') return 'warning'
  return 'success'
}

const jobStatusTagType = (status?: string) => {
  if (status === 'FAILED') return 'danger'
  if (status === 'RUNNING') return 'warning'
  return 'success'
}

const logLevelTagType = (level?: string) => {
  if (level === 'ERROR') return 'danger'
  if (level === 'WARN') return 'warning'
  return 'info'
}

const formatDateTime = (value?: string) => {
  if (!value) return '暂无记录'
  return value.replace('T', ' ').slice(0, 19)
}

const formatDuration = (value?: number) => {
  if (value === undefined || value === null) return '-'
  if (value < 1000) return `${value} ms`
  return `${(value / 1000).toFixed(2)} s`
}

const jobRowClassName = ({ row }: { row: MonitorRecentJob }) => {
  if (row.status === 'FAILED') return 'monitor-row-error'
  if (row.status === 'RUNNING') return 'monitor-row-warn'
  return ''
}

const logRowClassName = ({ row }: { row: MonitorRecentLog }) => {
  if (row.level === 'ERROR') return 'monitor-row-error'
  if (row.level === 'WARN') return 'monitor-row-warn'
  return ''
}

const summarizeText = (value?: string, max = 80) => {
  if (!value) return '-'
  if (value.length <= max) return value
  return `${value.slice(0, max)}...`
}

const formatLogContext = (value?: string) => {
  if (!value) return '-'
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

const copyText = async (value: string, successMessage: string) => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
    } else {
      const input = document.createElement('textarea')
      input.value = value
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.focus()
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    ElMessage.success(successMessage)
  } catch {
    ElMessage.error('复制失败')
  }
}

const copySelectedLogContent = async () => {
  if (!selectedLog.value) return
  const segments = [
    `时间: ${formatDateTime(selectedLog.value.gmt_create)}`,
    `级别: ${selectedLog.value.level || '-'}`,
    `模块: ${selectedLog.value.module || '-'}`,
    `Trace ID: ${selectedLog.value.trace_id || '-'}`,
    '',
    '消息内容:',
    selectedLog.value.message || '-'
  ]

  if (selectedLog.value.exception) {
    segments.push('', '异常信息:', selectedLog.value.exception)
  }
  if (selectedLog.value.context) {
    segments.push('', '上下文:', formatLogContext(selectedLog.value.context))
  }

  await copyText(segments.join('\n'), '日志内容已复制')
}

const buildJobDetailContent = (job: MonitorRecentJob) => {
  return [
    `任务名称: ${job.job_name}`,
    `任务类型: ${job.job_type}`,
    `状态: ${job.status}`,
    `Trace ID: ${job.trace_id || '-'}`,
    `开始时间: ${formatDateTime(job.started_at || job.gmt_create)}`,
    `结束时间: ${formatDateTime(job.finished_at)}`,
    `耗时: ${formatDuration(job.duration_ms)}`,
    `总数: ${job.total_rows ?? 0}`,
    `成功: ${job.success_rows ?? 0}`,
    `失败: ${job.failed_rows ?? 0}`
  ].join('\n')
}

const copySelectedJobContent = async () => {
  if (!selectedJob.value) return
  const segments = [buildJobDetailContent(selectedJob.value)]
  if (selectedJob.value.error_message) {
    segments.push('', '错误信息:', selectedJob.value.error_message)
  }
  await copyText(segments.join('\n'), '任务内容已复制')
}

onMounted(() => {
  loadOverview()
  loadJobs()
  loadLogs()
})
</script>

<style scoped src="@/modules/system/styles/system-monitor.css"></style>


import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { shallowMount } from '@vue/test-utils'
import SystemMonitor from '@/modules/system/views/SystemMonitor.vue'

vi.mock('@/modules/system/api', () => ({
  getMonitorOverview: vi.fn().mockResolvedValue({
    success: true,
    data: {
      overall_status: 'WARN',
      generated_at: '2026-03-10T12:00:00',
      database: {
        name: '数据库',
        status: 'OK',
        message: '连接正常',
        checked_at: '2026-03-10T12:00:00'
      },
      migrations: {
        name: '迁移',
        status: 'WARN',
        message: '存在待执行迁移',
        checked_at: '2026-03-10T12:00:00',
        pending_count: 2
      },
      tasks: [
        {
          name: '采购计划任务',
          status: 'ERROR',
          last_status: 'FAILED',
          last_run_at: '2026-03-10T11:00:00',
          message: '最近执行失败'
        }
      ],
      alerts: ['采购计划任务执行失败']
    }
  }),
  getRecentMonitorJobs: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        trace_id: 'trace-001',
        job_type: 'SCHEDULER',
        job_name: '采购计划任务',
        status: 'FAILED',
        started_at: '2026-03-10T11:00:00',
        finished_at: '2026-03-10T11:01:00',
        duration_ms: 60000,
        total_rows: 10,
        success_rows: 8,
        failed_rows: 2,
        error_message: '任务执行失败',
        gmt_create: '2026-03-10T11:00:00'
      }
    ]
  }),
  getRecentMonitorLogs: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        trace_id: 'trace-001',
        level: 'ERROR',
        module: 'procurement',
        message: '采购计划失败',
        context: '{"job":"replenishment"}',
        exception: 'runtime error',
        gmt_create: '2026-03-10T11:00:00'
      }
    ]
  })
}))

const CardStub = defineComponent({ template: '<div><slot name="header" /><slot /></div>' })
const Stub = defineComponent({ inheritAttrs: false, template: '<div><slot /></div>' })
const TableStub = defineComponent({ inheritAttrs: false, template: '<div><slot /></div>' })
const ColumnStub = defineComponent({
  inheritAttrs: false,
  setup(_, { slots }) {
    return () => (slots.default ? slots.default({ row: {} }) : null)
  }
})

describe('SystemMonitor', () => {
  it('renders workbench title, summary cards and key sections', async () => {
    const wrapper = shallowMount(SystemMonitor, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-button': Stub,
          'el-tag': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-dialog': Stub
        },
        directives: {
          loading: {}
        }
      }
    })

    await vi.dynamicImportSettled()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('系统监控')
    expect(wrapper.findAll('[data-testid="system-monitor-summary-card"]')).toHaveLength(4)
    expect(wrapper.text()).toContain('核心信号')
    expect(wrapper.text()).toContain('最近任务')
    expect(wrapper.text()).toContain('最近系统日志')
  })
})

import { watch } from 'vue'
import type { AuditLog } from '@/modules/system/types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { useFieldLabelStore } from '@/modules/common/stores/fieldLabelStore'

const ZH_EMPTY = '空'
const EN_EMPTY = 'Empty'

const ACTION_LABELS_ZH: Record<string, string> = {
  CREATE: '创建了',
  UPDATE: '修改了',
  DELETE: '删除了'
}

const ACTION_LABELS_EN: Record<string, string> = {
  CREATE: 'created',
  UPDATE: 'updated',
  DELETE: 'deleted'
}

const IGNORED_FIELDS = new Set([
  'updated_at',
  'created_at',
  'updated_by',
  'created_by',
  'id'
])

export const useAuditLogFormatter = () => {
  const localeStore = useLocaleStore()
  const fieldLabelStore = useFieldLabelStore()

  const ensureLabels = (locale: string) => {
    fieldLabelStore.ensureLoaded(locale)
  }

  watch(
    () => localeStore.locale,
    (value) => ensureLabels(value),
    { immediate: true }
  )

  const getFieldLabel = (key: string) => {
    return fieldLabelStore.getLabel(key)
  }

  const formatAuditSummary = (row: AuditLog) => {
    const isEnglish = localeStore.locale === 'en-US'
    const operator = row.username || (row.user_id ? `User#${row.user_id}` : isEnglish ? 'System' : '系统')
    const actionLabels = isEnglish ? ACTION_LABELS_EN : ACTION_LABELS_ZH
    const action = actionLabels[row.action] || row.action || (isEnglish ? 'changed' : '操作了')
    const pairs = getChangePairs(row.changes)
    const settingKey = getSettingKey(pairs)
    const diffs = pairs
      .filter(({ key }) => !IGNORED_FIELDS.has(key))
      .map(({ key, before, after }) => {
        const label = getFieldLabel(key)
        const beforeText = formatValueForField(key, before)
        const afterText = formatValueForField(key, after)
        const beforeNorm = normalizeValueForCompare(beforeText)
        const afterNorm = normalizeValueForCompare(afterText)
        if (beforeNorm === afterNorm) {
          return null
        }
        return `${label}【${beforeText}】=>【${afterText}】`
      })
      .filter((item): item is string => item !== null)

    const prefix = settingKey ? (isEnglish ? `setting【${settingKey}】` : `设置【${settingKey}】`) : ''

    if (!diffs.length) {
      return prefix ? `${operator} ${action} ${prefix}` : `${operator} ${action}`
    }

    return prefix
      ? `${operator} ${action} ${prefix} ${diffs.join('，')}`
      : `${operator} ${action} ${diffs.join('，')}`
  }

  const getChangeRows = (changes: string | null | undefined) => {
    if (!changes) return []
    try {
      const parsed = JSON.parse(changes)
      const before = parsed?.before ?? {}
      const after = parsed?.after ?? {}
      const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)])
      return Array.from(keys)
        .sort()
        .map((key) => ({
          key: getFieldLabel(key),
          before: formatValueForField(key, before?.[key]),
          after: formatValueForField(key, after?.[key])
        }))
    } catch (error) {
      return [
        {
          key: localeStore.locale === 'en-US' ? 'changes' : '变更',
          before: '-',
          after: String(changes)
        }
      ]
    }
  }

  const getChangePairs = (changes?: string | null) => {
    if (!changes) return []
    try {
      const parsed = JSON.parse(changes)
      const before = parsed?.before ?? {}
      const after = parsed?.after ?? {}
      const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)])
      return Array.from(keys)
        .sort()
        .map((key) => ({
          key,
          before: before?.[key],
          after: after?.[key]
        }))
    } catch (error) {
      return []
    }
  }

  const getSettingKey = (pairs: Array<{ key: string; before: unknown; after: unknown }>) => {
    const match = pairs.find((item) => item.key === 'setting_key')
    return match?.after ?? match?.before ?? null
  }

  const formatValueForField = (key: string, value: unknown) => {
    if (key === 'image_url') {
      return formatImageValue(value)
    }
    if (key === 'images') {
      return formatImagesValue(value)
    }
    if (key.toLowerCase() === 'status') {
      return formatStatusValue(value)
    }
    return formatValue(value)
  }

  const formatStatusValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return formatValue(value)
    }
    const raw = String(value)
    const key = `STATUS_${raw.toUpperCase()}`
    const label = fieldLabelStore.getLabel(key)
    return label !== key ? label : raw
  }

  const formatImageValue = (value: unknown) => {
    if (!value) return localeStore.locale === 'en-US' ? EN_EMPTY : ZH_EMPTY
    if (typeof value !== 'string') return formatValue(value)
    const parts = value.split('/')
    return parts[parts.length - 1] || value
  }

  const formatImagesValue = (value: unknown) => {
    if (!Array.isArray(value)) return formatValue(value)
    if (!value.length) return localeStore.locale === 'en-US' ? EN_EMPTY : ZH_EMPTY
    return value.map((item) => formatImageValue(item)).join(', ')
  }

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return localeStore.locale === 'en-US' ? EN_EMPTY : ZH_EMPTY
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }
    try {
      return JSON.stringify(value)
    } catch (error) {
      return String(value)
    }
  }

  const normalizeValueForCompare = (value: string) => {
    const trimmed = value.trim()
    if (localeStore.locale === 'en-US') {
      return trimmed === EN_EMPTY ? '' : trimmed
    }
    return trimmed === ZH_EMPTY ? '' : trimmed
  }

  return {
    formatAuditSummary,
    getChangeRows
  }
}

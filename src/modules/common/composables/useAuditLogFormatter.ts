import { watch } from 'vue'
import type { AuditLog } from '@/modules/system/types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { useFieldLabelStore } from '@/modules/common/stores/fieldLabelStore'

const ZH_EMPTY = '空'
const EN_EMPTY = 'Empty'

const ACTION_LABELS_ZH: Record<string, string> = {
  CREATE: '创建了',
  UPDATE: '修改了',
  DELETE: '删除了',
  SUBMIT: '提交了',
  SHIP: '发货了',
  RECEIVE: '收货了',
  INSPECT: '质检了',
  CLOSE: '关闭了',
  CREATE_PRODUCT: '新增产品',
  UPDATE_PRODUCT: '编辑产品',
  DELETE_PRODUCT: '删除产品',
  CREATE_PRODUCT_CONFIG: '新增产品配置',
  UPDATE_PRODUCT_CONFIG: '编辑产品配置',
  DELETE_PRODUCT_CONFIG: '删除产品配置',
  CREATE_PRODUCT_CATEGORY: '新增产品品类',
  UPDATE_PRODUCT_CATEGORY: '编辑产品品类',
  DELETE_PRODUCT_CATEGORY: '删除产品品类',
  CREATE_PRODUCT_GROUP: '新增产品归组',
  UPDATE_PRODUCT_GROUP: '编辑产品归组',
  DELETE_PRODUCT_GROUP: '删除产品归组',
  ATTACH_PRODUCT_GROUP_CHILDREN: '挂载归组产品',
  DETACH_PRODUCT_GROUP_CHILD: '移除归组产品',
  CREATE_PRODUCT_COMBO: '新增产品组合',
  UPDATE_PRODUCT_COMBO: '编辑产品组合',
  DELETE_PRODUCT_COMBO: '删除产品组合',
  SAVE_PRODUCT_IMAGES: '保存产品图片',
  SAVE_PRODUCT_PACKAGING: '保存产品包材',
  AUTO_CREATE_DEFAULT_SUPPLIER_QUOTE: '自动创建默认供应商报价',
  SET_DEFAULT_SUPPLIER: '切换默认供应商',
  PACK_COMPLETE: '打包完成',
  CREATE_CASH_LEDGER: '新增现金流水',
  REVERSE_CASH_LEDGER: '冲销现金流水'
}

const ACTION_LABELS_EN: Record<string, string> = {
  CREATE: 'created',
  UPDATE: 'updated',
  DELETE: 'deleted',
  SUBMIT: 'submitted',
  SHIP: 'shipped',
  RECEIVE: 'received',
  INSPECT: 'inspected',
  CLOSE: 'closed',
  CREATE_PRODUCT: 'created product',
  UPDATE_PRODUCT: 'updated product',
  DELETE_PRODUCT: 'deleted product',
  CREATE_PRODUCT_CONFIG: 'created product config',
  UPDATE_PRODUCT_CONFIG: 'updated product config',
  DELETE_PRODUCT_CONFIG: 'deleted product config',
  CREATE_PRODUCT_CATEGORY: 'created product category',
  UPDATE_PRODUCT_CATEGORY: 'updated product category',
  DELETE_PRODUCT_CATEGORY: 'deleted product category',
  CREATE_PRODUCT_GROUP: 'created product group',
  UPDATE_PRODUCT_GROUP: 'updated product group',
  DELETE_PRODUCT_GROUP: 'deleted product group',
  ATTACH_PRODUCT_GROUP_CHILDREN: 'attached group children',
  DETACH_PRODUCT_GROUP_CHILD: 'detached group child',
  CREATE_PRODUCT_COMBO: 'created product combo',
  UPDATE_PRODUCT_COMBO: 'updated product combo',
  DELETE_PRODUCT_COMBO: 'deleted product combo',
  SAVE_PRODUCT_IMAGES: 'saved product images',
  SAVE_PRODUCT_PACKAGING: 'saved product packaging',
  AUTO_CREATE_DEFAULT_SUPPLIER_QUOTE: 'auto created default supplier quote',
  SET_DEFAULT_SUPPLIER: 'set default supplier',
  PACK_COMPLETE: 'packing completed',
  CREATE_CASH_LEDGER: 'created cash ledger',
  REVERSE_CASH_LEDGER: 'reversed cash ledger'
}

const ENTITY_LABELS_ZH: Record<string, string> = {
  Product: '产品',
  ProductGroup: '产品归组',
  ProductParent: '产品归组',
  ProductCombo: '产品组合',
  ProductSupplierQuote: '产品供应商报价',
  PurchaseOrder: '采购单',
  ReplenishmentPlan: '采购计划',
  SalesOrder: '销售订单',
  Shipment: '货件',
  PackagingItem: '包材',
  PackagingPurchaseOrder: '包材采购单',
  CashLedger: '现金流水',
  ExchangeRate: '汇率',
  ConfigCenter: '配置中心',
  Menu: '菜单',
  User: '用户',
  Role: '角色',
  System: '系统'
}

const ENTITY_LABELS_EN: Record<string, string> = {
  Product: 'Product',
  ProductGroup: 'Product Group',
  ProductParent: 'Product Group',
  ProductCombo: 'Product Combo',
  ProductSupplierQuote: 'Product Supplier Quote',
  PurchaseOrder: 'Purchase Order',
  ReplenishmentPlan: 'Replenishment Plan',
  SalesOrder: 'Sales Order',
  Shipment: 'Shipment',
  PackagingItem: 'Packaging Item',
  PackagingPurchaseOrder: 'Packaging Purchase Order',
  CashLedger: 'Cash Ledger',
  ExchangeRate: 'Exchange Rate',
  ConfigCenter: 'Config Center',
  Menu: 'Menu',
  User: 'User',
  Role: 'Role',
  System: 'System'
}

const ENTITY_ACTION_LABELS_ZH: Record<string, Record<string, string>> = {
  PurchaseOrder: {
    CREATE: '新增采购单',
    UPDATE: '编辑采购单',
    DELETE: '删除采购单',
    SUBMIT: '提交采购单',
    SHIP: '采购发货',
    RECEIVE: '采购收货',
    INSPECT: '采购质检',
    CLOSE: '完成采购单',
    FORCE_COMPLETE: '强制完成采购单'
  },
  Shipment: {
    CREATE: '新增发货单',
    CONFIRM: '确认发货单',
    SHIP: '发货单发货',
    DELIVER: '发货单送达',
    RECEIVE: '平台上架',
    CANCEL: '取消发货单'
  },
  CashLedger: {
    CREATE_CASH_LEDGER: '新增现金流水',
    REVERSE_CASH_LEDGER: '冲销现金流水'
  }
}

const ENTITY_ACTION_LABELS_EN: Record<string, Record<string, string>> = {
  PurchaseOrder: {
    CREATE: 'created purchase order',
    UPDATE: 'updated purchase order',
    DELETE: 'deleted purchase order',
    SUBMIT: 'submitted purchase order',
    SHIP: 'shipped purchase order',
    RECEIVE: 'received purchase order',
    INSPECT: 'inspected purchase order',
    CLOSE: 'completed purchase order',
    FORCE_COMPLETE: 'force completed purchase order'
  },
  Shipment: {
    CREATE: 'created shipment',
    CONFIRM: 'confirmed shipment',
    SHIP: 'shipped shipment',
    DELIVER: 'delivered shipment',
    RECEIVE: 'platform received shipment',
    CANCEL: 'cancelled shipment'
  },
  CashLedger: {
    CREATE_CASH_LEDGER: 'created cash ledger',
    REVERSE_CASH_LEDGER: 'reversed cash ledger'
  }
}

const FIELD_LABEL_OVERRIDES_ZH: Record<string, string> = {
  po_number: '采购单号',
  supplier_name: '供应商',
  marketplace: '站点',
  total_amount: '总金额',
  created_at: '创建时间',
  ordered_at: '下单时间',
  ordered_by_name: '下单人',
  shipped_at: '发货时间',
  shipped_by_name: '发货人',
  received_at: '收货时间',
  received_by_name: '收货人',
  inspected_at: '质检时间',
  inspected_by_name: '质检人',
  closed_at: '完成时间',
  completed_by_name: '完成人',
  force_completed_at: '强制完成时间',
  force_completed_by_name: '强制完成人',
  force_complete_reason: '异常原因',
  items: '采购明细',
  seller_sku: '产品编码',
  product_title: '产品标题',
  qty_ordered: '采购数量',
  qty_received: '收货数量',
  qty_pending_inspection: '待检数量',
  qty_inspection_pass: '质检通过',
  qty_inspection_fail: '质检不合格',
  unit_cost: '单价',
  subtotal: '小计',
  shipment_number: '发货单号',
  receipt_status: '接收状态',
  receipt_completed_at: '接收完成时间',
  receipt_completed_by_name: '接收完成人',
  received_quantity_total: '已接收数量',
  remaining_quantity_total: '待接收数量',
  confirmed_at: '确认时间',
  confirmed_by_name: '确认人',
  delivered_at: '送达时间',
  delivered_by_name: '送达人',
  ledger_type: '收支类型',
  category: '流水类别',
  original_currency: '原币',
  original_amount: '原币金额',
  base_currency: '基准币',
  base_amount: '基准金额',
  fx_rate: '汇率',
  occurred_node: '发生节点',
  reference_type: '来源单据类型',
  reference_id: '来源单据ID',
  occurred_at: '发生时间',
  reversal_reason: '冲销原因',
  reversal_entry_id: '冲销流水',
  reversal_of_id: '冲销来源'
}

const FIELD_LABEL_OVERRIDES_EN: Record<string, string> = {
  po_number: 'PO Number',
  supplier_name: 'Supplier',
  marketplace: 'Marketplace',
  total_amount: 'Total Amount',
  created_at: 'Created At',
  ordered_at: 'Ordered At',
  ordered_by_name: 'Ordered By',
  shipped_at: 'Shipped At',
  shipped_by_name: 'Shipped By',
  received_at: 'Received At',
  received_by_name: 'Received By',
  inspected_at: 'Inspected At',
  inspected_by_name: 'Inspected By',
  closed_at: 'Closed At',
  completed_by_name: 'Completed By',
  force_completed_at: 'Force Completed At',
  force_completed_by_name: 'Force Completed By',
  force_complete_reason: 'Exception Reason',
  items: 'Items',
  seller_sku: 'Product Code',
  product_title: 'Product Title',
  qty_ordered: 'Ordered Qty',
  qty_received: 'Received Qty',
  qty_pending_inspection: 'Pending Inspection',
  qty_inspection_pass: 'Inspection Pass',
  qty_inspection_fail: 'Inspection Fail',
  unit_cost: 'Unit Cost',
  subtotal: 'Subtotal',
  shipment_number: 'Shipment Number',
  receipt_status: 'Receipt Status',
  receipt_completed_at: 'Receipt Completed At',
  receipt_completed_by_name: 'Receipt Completed By',
  received_quantity_total: 'Received Quantity',
  remaining_quantity_total: 'Remaining Quantity',
  confirmed_at: 'Confirmed At',
  confirmed_by_name: 'Confirmed By',
  delivered_at: 'Delivered At',
  delivered_by_name: 'Delivered By',
  ledger_type: 'Ledger Type',
  category: 'Category',
  original_currency: 'Original Currency',
  original_amount: 'Original Amount',
  base_currency: 'Base Currency',
  base_amount: 'Base Amount',
  fx_rate: 'FX Rate',
  occurred_node: 'Occurred Node',
  reference_type: 'Reference Type',
  reference_id: 'Reference ID',
  occurred_at: 'Occurred At',
  reversal_reason: 'Reverse Reason',
  reversal_entry_id: 'Reversal Entry',
  reversal_of_id: 'Reversal Source'
}

const STATUS_LABELS_ZH: Record<string, string> = {
  DRAFT: '草稿',
  ORDERED: '已下单',
  SHIPPED: '已发货',
  RECEIVED: '已收货',
  CLOSED: '已完成',
  CONFIRMED: '已确认',
  DELIVERED: '已送达',
  CANCELLED: '已取消',
  PENDING: '待接收',
  PARTIAL: '部分接收',
  COMPLETED: '已接收'
  ,
  NORMAL: '正常',
  REVERSED: '已冲销'
}

const STATUS_LABELS_EN: Record<string, string> = {
  DRAFT: 'Draft',
  ORDERED: 'Ordered',
  SHIPPED: 'Shipped',
  RECEIVED: 'Received',
  CLOSED: 'Closed',
  CONFIRMED: 'Confirmed',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
  PARTIAL: 'Partial',
  COMPLETED: 'Completed'
  ,
  NORMAL: 'Normal',
  REVERSED: 'Reversed'
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
    const storeLabel = fieldLabelStore.getLabel(key)
    if (storeLabel !== key) {
      return storeLabel
    }
    const normalizedKey = key.trim().toLowerCase()
    const labels = localeStore.locale === 'en-US' ? FIELD_LABEL_OVERRIDES_EN : FIELD_LABEL_OVERRIDES_ZH
    return labels[normalizedKey] || key
  }

  const getEntityTypeLabel = (entityType?: string | null) => {
    if (!entityType) return localeStore.locale === 'en-US' ? EN_EMPTY : ZH_EMPTY
    const labels = localeStore.locale === 'en-US' ? ENTITY_LABELS_EN : ENTITY_LABELS_ZH
    return labels[entityType] || entityType
  }

  const getActionLabel = (action?: string | null, entityType?: string | null) => {
    if (!action) return localeStore.locale === 'en-US' ? EN_EMPTY : ZH_EMPTY
    const entityActionLabels = localeStore.locale === 'en-US' ? ENTITY_ACTION_LABELS_EN : ENTITY_ACTION_LABELS_ZH
    const entityLabel = entityType ? entityActionLabels[entityType]?.[action] : undefined
    if (entityLabel) {
      return entityLabel
    }
    const labels = localeStore.locale === 'en-US' ? ACTION_LABELS_EN : ACTION_LABELS_ZH
    return labels[action] || action
  }

  const formatAuditSummary = (row: AuditLog) => {
    const isEnglish = localeStore.locale === 'en-US'
    const operator = row.username || (row.user_id ? `User#${row.user_id}` : isEnglish ? 'System' : '系统')
    const action = getActionLabel(row.action, row.entity_type) || (isEnglish ? 'changed' : '操作了')
    const changes = formatAuditChanges(row)

    if (!changes) {
      return `${operator} ${action}`
    }

    return `${operator} ${action} ${changes}`
  }

  const formatAuditChanges = (row: AuditLog) => {
    const isEnglish = localeStore.locale === 'en-US'
    const pairs = getChangePairs(row.changes)
    const settingKey = getSettingKey(pairs)
    const diffs = pairs
      .filter(({ key }) => !IGNORED_FIELDS.has(key))
      .map(({ key, before, after }) => {
        const label = getFieldLabel(key)
        const beforeText = formatAuditFieldValue(key, before)
        const afterText = formatAuditFieldValue(key, after)
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
      return prefix
    }

    return prefix
      ? `${prefix} ${diffs.join('，')}`
      : diffs.join('，')
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
          before: formatAuditFieldValue(key, before?.[key]),
          after: formatAuditFieldValue(key, after?.[key])
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

  const formatAuditFieldValue = (key: string, value: unknown) => {
    if (key === 'image_url') {
      return formatImageValue(value)
    }
    if (key === 'images') {
      return formatImagesValue(value)
    }
    if (key === 'items') {
      return formatPurchaseOrderItemsValue(value)
    }
    if (key === 'receipt_status') {
      return formatStatusValue(value)
    }
    if (key === 'ledger_type') {
      return formatLedgerTypeValue(value)
    }
    if (key === 'category') {
      return formatLedgerCategoryValue(value)
    }
    if (key === 'reference_type') {
      return formatReferenceTypeValue(value)
    }
    if (key === 'occurred_node') {
      return formatOccurredNodeValue(value)
    }
    if (key.toLowerCase() === 'status') {
      return formatStatusValue(value)
    }
    return formatValue(value)
  }

  const formatLedgerTypeValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return formatValue(value)
    }
    const labels = localeStore.locale === 'en-US'
      ? { INCOME: 'Income', EXPENSE: 'Expense' }
      : { INCOME: '收入', EXPENSE: '支出' }
    return labels[String(value).toUpperCase() as 'INCOME' | 'EXPENSE'] || String(value)
  }

  const formatLedgerCategoryValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return formatValue(value)
    }
    const labels = localeStore.locale === 'en-US'
      ? {
          SALES_REVENUE: 'Sales Revenue',
          PURCHASE_COST: 'Purchase Cost',
          SHIPPING_FEE: 'Shipping Fee',
          PACKAGING_COST: 'Packaging Cost',
          OTHER_INCOME: 'Other Income',
          OTHER_EXPENSE: 'Other Expense'
        }
      : {
          SALES_REVENUE: '销售收入',
          PURCHASE_COST: '采购成本',
          SHIPPING_FEE: '运费',
          PACKAGING_COST: '包装成本',
          OTHER_INCOME: '其他收入',
          OTHER_EXPENSE: '其他支出'
        }
    return labels[String(value).toUpperCase() as keyof typeof labels] || String(value)
  }

  const formatReferenceTypeValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return formatValue(value)
    }
    const labels = localeStore.locale === 'en-US'
      ? { PURCHASE_ORDER: 'Purchase Order', SHIPMENT: 'Shipment', MANUAL: 'Manual' }
      : { PURCHASE_ORDER: '采购单', SHIPMENT: '发货单', MANUAL: '手工' }
    return labels[String(value).toUpperCase() as keyof typeof labels] || String(value)
  }

  const formatOccurredNodeValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return formatValue(value)
    }
    const labels = localeStore.locale === 'en-US'
      ? {
          MANUAL: 'Manual Entry',
          REVERSED: 'Reversal',
          PROCUREMENT: 'Procurement',
          SHIPMENT: 'Shipment',
          PROFIT: 'Profit',
          CASH_LEDGER: 'Cash Ledger'
        }
      : {
          MANUAL: '手工录入',
          REVERSED: '冲销',
          PROCUREMENT: '采购',
          SHIPMENT: '发货',
          PROFIT: '利润',
          CASH_LEDGER: '现金流水'
        }
    return labels[String(value).toUpperCase() as keyof typeof labels] || String(value)
  }

  const formatStatusValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return formatValue(value)
    }
    const raw = String(value)
    const key = `STATUS_${raw.toUpperCase()}`
    const label = fieldLabelStore.getLabel(key)
    if (label !== key) {
      return label
    }
    const labels = localeStore.locale === 'en-US' ? STATUS_LABELS_EN : STATUS_LABELS_ZH
    return labels[raw.toUpperCase()] || raw
  }

  const formatPurchaseOrderItemsValue = (value: unknown) => {
    if (!Array.isArray(value)) return formatValue(value)
    if (!value.length) return localeStore.locale === 'en-US' ? EN_EMPTY : ZH_EMPTY
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return formatValue(item)
        const row = item as Record<string, unknown>
        const code = row.seller_sku ? String(row.seller_sku) : localeStore.locale === 'en-US' ? 'Product' : '产品'
        const title = row.product_title ? ` ${String(row.product_title)}` : ''
        const details: string[] = []
        if (Object.prototype.hasOwnProperty.call(row, 'qty_ordered')) {
          details.push(localeStore.locale === 'en-US' ? `qty ${row.qty_ordered ?? 0}` : `采购 ${row.qty_ordered ?? 0}`)
        }
        if (Object.prototype.hasOwnProperty.call(row, 'qty_received')) {
          details.push(localeStore.locale === 'en-US' ? `received ${row.qty_received ?? 0}` : `收货 ${row.qty_received ?? 0}`)
        }
        if (Object.prototype.hasOwnProperty.call(row, 'qty_pending_inspection')) {
          details.push(localeStore.locale === 'en-US' ? `pending ${row.qty_pending_inspection ?? 0}` : `待检 ${row.qty_pending_inspection ?? 0}`)
        }
        if (Object.prototype.hasOwnProperty.call(row, 'qty_inspection_pass')) {
          details.push(localeStore.locale === 'en-US' ? `pass ${row.qty_inspection_pass ?? 0}` : `通过 ${row.qty_inspection_pass ?? 0}`)
        }
        if (Object.prototype.hasOwnProperty.call(row, 'qty_inspection_fail')) {
          details.push(localeStore.locale === 'en-US' ? `fail ${row.qty_inspection_fail ?? 0}` : `不合格 ${row.qty_inspection_fail ?? 0}`)
        }
        if (Object.prototype.hasOwnProperty.call(row, 'unit_cost')) {
          details.push(localeStore.locale === 'en-US' ? `unit ${row.unit_cost ?? 0}` : `单价 ${row.unit_cost ?? 0}`)
        }
        if (Object.prototype.hasOwnProperty.call(row, 'subtotal')) {
          details.push(localeStore.locale === 'en-US' ? `subtotal ${row.subtotal ?? 0}` : `小计 ${row.subtotal ?? 0}`)
        }
        if (localeStore.locale === 'en-US') {
          return details.length ? `${code}${title}, ${details.join(', ')}` : `${code}${title}`
        }
        return details.length ? `${code}${title}，${details.join('，')}` : `${code}${title}`
      })
      .join(localeStore.locale === 'en-US' ? '; ' : '；')
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
    getFieldLabel,
    getActionLabel,
    formatAuditSummary,
    formatAuditChanges,
    formatAuditFieldValue,
    getChangePairs,
    getChangeRows,
    getEntityTypeLabel
  }
}

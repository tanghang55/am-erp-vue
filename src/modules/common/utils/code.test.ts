import { describe, expect, it } from 'vitest'
import { isValidCode, isValidPermissionCode } from './code'

describe('isValidCode', () => {
  it('accepts only letters numbers hyphen and underscore', () => {
    expect(isValidCode('WH-US-001')).toBe(true)
    expect(isValidCode('CAT_L2_01')).toBe(true)
    expect(isValidCode('仓库001')).toBe(false)
    expect(isValidCode('CAT@001')).toBe(false)
    expect(isValidCode('')).toBe(false)
  })
})

describe('isValidPermissionCode', () => {
  it('accepts dot-separated permission codes and rejects chinese or special symbols', () => {
    expect(isValidPermissionCode('system.manage')).toBe(true)
    expect(isValidPermissionCode('inventory.adjustments.view')).toBe(true)
    expect(isValidPermissionCode('权限.manage')).toBe(false)
    expect(isValidPermissionCode('system@manage')).toBe(false)
    expect(isValidPermissionCode('')).toBe(false)
  })
})

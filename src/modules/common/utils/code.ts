const codePattern = /^[A-Za-z0-9_-]+$/
const permissionCodePattern = /^[A-Za-z0-9._-]+$/

export const isValidCode = (value?: string | null): boolean => {
  if (!value) return false
  return codePattern.test(value)
}

export const buildCodeValidator = (message = '编码只允许字母、数字、中划线、下划线') => {
  return (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback()
      return
    }
    if (!isValidCode(value)) {
      callback(new Error(message))
      return
    }
    callback()
  }
}

export const isValidPermissionCode = (value?: string | null): boolean => {
  if (!value) return false
  return permissionCodePattern.test(value)
}

export const buildPermissionCodeValidator = (message = '权限编码只允许字母、数字、点号、中划线、下划线') => {
  return (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback()
      return
    }
    if (!isValidPermissionCode(value)) {
      callback(new Error(message))
      return
    }
    callback()
  }
}

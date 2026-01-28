/**
 * 愿望表单验证规则
 * 提供统一的表单验证功能
 */

/**
 * 验证错误信息
 * @typedef {Object} ValidationError
 * @property {string} field - 字段名
 * @property {string} message - 错误消息
 */

/**
 * 验证结果
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - 是否验证通过
 * @property {ValidationError[]} errors - 错误列表
 */

/**
 * 愿望表单数据
 * @typedef {Object} WishFormData
 * @property {string} title - 愿望名称
 * @property {string} description - 需求描述
 * @property {string} job - 提交者岗位
 * @property {string} [submitter] - 提交者姓名（可选）
 */

// 岗位选项列表
export const JOB_OPTIONS = ['开发', '设计', '产品', '运营', '行政', '测试', '人事', '财务']

// 验证规则配置
const VALIDATION_RULES = {
  title: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[\s\S]*$/,
    message: {
      required: '愿望名称不能为空',
      minLength: '愿望名称至少需要2个字符',
      maxLength: '愿望名称不能超过100个字符',
      pattern: '愿望名称格式不正确'
    }
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 1000,
    pattern: /^[\s\S]*$/,
    message: {
      required: '需求描述不能为空',
      minLength: '需求描述至少需要10个字符',
      maxLength: '需求描述不能超过1000个字符',
      pattern: '需求描述格式不正确'
    }
  },
  job: {
    required: true,
    enum: JOB_OPTIONS,
    message: {
      required: '请选择提交者岗位',
      enum: '请选择有效的岗位类型'
    }
  },
  submitter: {
    required: false,
    minLength: 1,
    maxLength: 50,
    pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\s]*$/,
    message: {
      minLength: '提交者姓名至少需要1个字符',
      maxLength: '提交者姓名不能超过50个字符',
      pattern: '提交者姓名只能包含中文、英文、数字和空格'
    }
  }
}

/**
 * 验证单个字段
 * @param {string} field - 字段名
 * @param {*} value - 字段值
 * @param {Object} rules - 验证规则
 * @returns {ValidationError|null} 验证错误，如果通过则返回null
 */
function validateField(field, value, rules) {
  // 必填验证
  if (rules.required && (value === null || value === undefined || value === '')) {
    return {
      field,
      message: rules.message.required || `${field}不能为空`
    }
  }

  // 如果字段不是必填且为空，跳过其他验证
  if (!rules.required && (value === null || value === undefined || value === '')) {
    return null
  }

  // 字符串长度验证
  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      return {
        field,
        message: rules.message.minLength || `${field}至少需要${rules.minLength}个字符`
      }
    }

    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      return {
        field,
        message: rules.message.maxLength || `${field}不能超过${rules.maxLength}个字符`
      }
    }

    // 正则表达式验证
    if (rules.pattern && !rules.pattern.test(value)) {
      return {
        field,
        message: rules.message.pattern || `${field}格式不正确`
      }
    }
  }

  // 枚举值验证
  if (rules.enum && !rules.enum.includes(value)) {
    return {
      field,
      message: rules.message.enum || `${field}必须是有效的选项`
    }
  }

  return null
}

/**
 * 验证愿望表单数据
 * @param {WishFormData} formData - 表单数据
 * @returns {ValidationResult} 验证结果
 */
export function validateWishForm(formData) {
  const errors = []

  // 验证每个字段
  for (const [field, rules] of Object.entries(VALIDATION_RULES)) {
    const value = formData[field]
    const error = validateField(field, value, rules)
    if (error) {
      errors.push(error)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 验证愿望名称
 * @param {string} title - 愿望名称
 * @returns {ValidationError|null} 验证错误，如果通过则返回null
 */
export function validateTitle(title) {
  return validateField('title', title, VALIDATION_RULES.title)
}

/**
 * 验证需求描述
 * @param {string} description - 需求描述
 * @returns {ValidationError|null} 验证错误，如果通过则返回null
 */
export function validateDescription(description) {
  return validateField('description', description, VALIDATION_RULES.description)
}

/**
 * 验证岗位
 * @param {string} job - 岗位
 * @returns {ValidationError|null} 验证错误，如果通过则返回null
 */
export function validateJob(job) {
  return validateField('job', job, VALIDATION_RULES.job)
}

/**
 * 验证提交者姓名
 * @param {string} submitter - 提交者姓名
 * @returns {ValidationError|null} 验证错误，如果通过则返回null
 */
export function validateSubmitter(submitter) {
  return validateField('submitter', submitter, VALIDATION_RULES.submitter)
}

/**
 * 获取字段的错误消息
 * @param {string} field - 字段名
 * @param {*} value - 字段值
 * @returns {string|null} 错误消息，如果验证通过则返回null
 */
export function getFieldError(field, value) {
  const rules = VALIDATION_RULES[field]
  if (!rules) {
    return null
  }

  const error = validateField(field, value, rules)
  return error ? error.message : null
}

/**
 * 验证并返回第一个错误消息（用于快速验证）
 * @param {WishFormData} formData - 表单数据
 * @returns {string|null} 第一个错误消息，如果验证通过则返回null
 */
export function getFirstError(formData) {
  const result = validateWishForm(formData)
  if (result.valid) {
    return null
  }
  return result.errors[0]?.message || null
}

/**
 * 检查表单是否可以保存为草稿
 * 草稿只需要基本的必填字段
 * @param {WishFormData} formData - 表单数据
 * @returns {boolean} 是否可以保存为草稿
 */
export function canSaveAsDraft(formData) {
  // 草稿至少需要标题、描述和岗位
  const titleError = validateTitle(formData.title)
  const descriptionError = validateDescription(formData.description)
  const jobError = validateJob(formData.job)

  return !titleError && !descriptionError && !jobError
}

/**
 * 检查表单是否可以提交（发布）
 * @param {WishFormData} formData - 表单数据
 * @returns {boolean} 是否可以提交
 */
export function canSubmit(formData) {
  const result = validateWishForm(formData)
  return result.valid
}

// 默认导出
export default {
  validateWishForm,
  validateTitle,
  validateDescription,
  validateJob,
  validateSubmitter,
  getFieldError,
  getFirstError,
  canSaveAsDraft,
  canSubmit,
  JOB_OPTIONS
}

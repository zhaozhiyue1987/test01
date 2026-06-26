const phonePattern = /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/;

export function calculateProfitRate(income, cost) {
  const parsedIncome = Number(income) || 0;
  const parsedCost = Number(cost) || 0;
  if (parsedIncome <= 0) return 0;
  return Math.round(((parsedIncome - parsedCost) / parsedIncome) * 10000) / 100;
}

export function transitionStatus(currentStatus, action) {
  const status = String(currentStatus);

  if (status === '40') {
    throw new Error('已转化商情不可继续流转');
  }

  if (status === '90') {
    if (action === 'reactivate') return '10';
    throw new Error('已终止商情只能重新激活');
  }

  if (action === 'terminate') {
    if (['10', '20', '30'].includes(status)) return '90';
  }

  if (action === 'advance') {
    const next = { 10: '20', 20: '30', 30: '40' }[status];
    if (next) return next;
  }

  if (action === 'rollback') {
    const previous = { 20: '10', 30: '20' }[status];
    if (previous) return previous;
    throw new Error('当前阶段不可退回');
  }

  throw new Error('当前阶段不可执行该操作');
}

export function validateOpportunityInput(input = {}) {
  const errors = {};
  if (!input.oppName?.trim()) errors.oppName = '商机名称必填';
  if (!input.custCode?.trim()) errors.custCode = '请选择客户';
  if (!input.oppRank) errors.oppRank = '商机等级必填';
  if (!input.oppType) errors.oppType = '商机类型必填';
  if (Number(input.projInvest) < 0) errors.projInvest = '预估收入必须大于等于 0';
  if (Number(input.proCost) < 0) errors.proCost = '预估成本必须大于等于 0';
  if (!input.contactName?.trim()) errors.contactName = '联系人名称必填';
  if (!phonePattern.test(String(input.contactPhone || ''))) {
    errors.contactPhone = '联系电话格式不正确';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateVisitInput(input = {}) {
  const errors = {};
  if (!input.oppCode?.trim()) errors.oppCode = '请选择关联商情';
  if (!input.visitObject?.trim()) errors.visitObject = '走访对象必填';
  if (!input.visitTime) errors.visitTime = '走访时间必填';
  if (!input.visitPurpose?.trim()) errors.visitPurpose = '走访目的必填';
  if ((input.photos || []).length > 3) errors.photos = '现场照片最多 3 张';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateCustomerInput(input = {}) {
  const errors = {};
  if (!input.custName?.trim()) errors.custName = '客户名称必填';
  if (input.contactPhone && !phonePattern.test(String(input.contactPhone))) {
    errors.contactPhone = '联系电话格式不正确';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

import { describe, expect, it } from 'vitest';
import {
  calculateProfitRate,
  transitionStatus,
  validateCustomerInput,
  validateOpportunityInput,
  validateVisitInput,
} from './domain.js';

describe('calculateProfitRate', () => {
  it('calculates percentage from income and cost with two decimals', () => {
    expect(calculateProfitRate(100000, 65000)).toBe(35);
    expect(calculateProfitRate(300000, 199999)).toBe(33.33);
  });

  it('returns 0 when income is 0 to avoid division by zero', () => {
    expect(calculateProfitRate(0, 1200)).toBe(0);
  });
});

describe('transitionStatus', () => {
  it('advances through the linear active workflow', () => {
    expect(transitionStatus('10', 'advance')).toBe('20');
    expect(transitionStatus('20', 'advance')).toBe('30');
    expect(transitionStatus('30', 'advance')).toBe('40');
  });

  it('rolls back one adjacent active stage', () => {
    expect(transitionStatus('20', 'rollback')).toBe('10');
    expect(transitionStatus('30', 'rollback')).toBe('20');
  });

  it('terminates active stages and reactivates terminated opportunities', () => {
    expect(transitionStatus('10', 'terminate')).toBe('90');
    expect(transitionStatus('20', 'terminate')).toBe('90');
    expect(transitionStatus('30', 'terminate')).toBe('90');
    expect(transitionStatus('90', 'reactivate')).toBe('10');
  });

  it('rejects invalid terminal transitions', () => {
    expect(() => transitionStatus('40', 'advance')).toThrow('已转化商情不可继续流转');
    expect(() => transitionStatus('40', 'terminate')).toThrow('已转化商情不可继续流转');
    expect(() => transitionStatus('10', 'rollback')).toThrow('当前阶段不可退回');
    expect(() => transitionStatus('90', 'advance')).toThrow('已终止商情只能重新激活');
  });
});

describe('validateOpportunityInput', () => {
  it('requires key opportunity fields and validates non-negative amounts', () => {
    const result = validateOpportunityInput({
      oppName: '',
      custCode: '',
      oppRank: '',
      oppType: '',
      projInvest: -1,
      proCost: -2,
      contactName: '',
      contactPhone: 'abc',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toMatchObject({
      oppName: '商机名称必填',
      custCode: '请选择客户',
      oppRank: '商机等级必填',
      oppType: '商机类型必填',
      projInvest: '预估收入必须大于等于 0',
      proCost: '预估成本必须大于等于 0',
      contactName: '联系人名称必填',
      contactPhone: '联系电话格式不正确',
    });
  });
});

describe('validateVisitInput', () => {
  it('requires visit object, time, and purpose', () => {
    const result = validateVisitInput({
      oppCode: '',
      visitObject: '',
      visitTime: '',
      visitPurpose: '',
      photos: ['1', '2', '3', '4'],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toMatchObject({
      oppCode: '请选择关联商情',
      visitObject: '走访对象必填',
      visitTime: '走访时间必填',
      visitPurpose: '走访目的必填',
      photos: '现场照片最多 3 张',
    });
  });
});

describe('validateCustomerInput', () => {
  it('requires customer name and validates contact phone when provided', () => {
    const result = validateCustomerInput({
      custName: '',
      contactPhone: '12',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toMatchObject({
      custName: '客户名称必填',
      contactPhone: '联系电话格式不正确',
    });
  });
});

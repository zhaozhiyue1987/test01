import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';

let app;

beforeEach(async () => {
  app = await createApp({ inMemory: true });
});

describe('GET /api/dictionaries', () => {
  it('returns statuses, ranks, types, and industries', async () => {
    const response = await request(app).get('/api/dictionaries').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.statuses).toContainEqual({ value: '10', label: '商情发现' });
    expect(response.body.data.ranks.length).toBeGreaterThan(0);
    expect(response.body.data.types).toContain('专线');
    expect(response.body.data.industries).toContain('金融');
  });
});

describe('opportunity APIs', () => {
  it('lists seeded opportunities with stats', async () => {
    const response = await request(app).get('/api/opportunities').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items.length).toBeGreaterThan(0);
    expect(response.body.data.stats.total).toBeGreaterThan(0);
    expect(response.body.data.stageCounts.all).toBe(response.body.data.stats.total);
  });

  it('creates an opportunity and calculates profit rate', async () => {
    const customers = await request(app).get('/api/customers?keyword=云启科技').expect(200);
    const customer = customers.body.data.items[0];

    const response = await request(app)
      .post('/api/opportunities')
      .send({
        custCode: customer.custCode,
        custName: '不应使用的手填客户名',
        industry: '不应使用的手填行业',
        oppName: '测试专线扩容项目',
        oppRank: '2',
        oppType: '专线',
        custRelation: '良好',
        oppDesc: '新增办公专线',
        projInvest: 200000,
        proCost: 120000,
        terminalCost: 8000,
        otherCost: 3000,
        signDate: '2026-07-20',
        contactName: '赵经理',
        contactPhone: '13800138000',
        contactJob: '信息主管',
        decisionInflu: '高',
        contactType: '业务联系人',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.oppStatus).toBe('10');
    expect(response.body.data.profitRate).toBe(40);
    expect(response.body.data.custCode).toBe(customer.custCode);
    expect(response.body.data.custName).toBe(customer.custName);
    expect(response.body.data.industry).toBe(customer.industry);
  });

  it('rejects opportunity creation when customer code is not bound to an existing customer', async () => {
    const response = await request(app)
      .post('/api/opportunities')
      .send({
        custCode: 'CU-NOT-FOUND',
        oppName: '无效客户商情',
        oppRank: '2',
        oppType: '专线',
        projInvest: 200000,
        proCost: 120000,
        contactName: '赵经理',
        contactPhone: '13800138000',
      })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('客户不存在，请先选择有效客户');
  });

  it('returns opportunity detail and transitions status', async () => {
    const list = await request(app).get('/api/opportunities').expect(200);
    const firstId = list.body.data.items[0].oppId;

    const detail = await request(app).get(`/api/opportunities/${firstId}`).expect(200);
    expect(detail.body.data.contacts.length).toBeGreaterThan(0);
    expect(detail.body.data.invest.projInvest).toBeGreaterThan(0);

    const transitioned = await request(app)
      .patch(`/api/opportunities/${firstId}/status`)
      .send({ action: 'advance' })
      .expect(200);

    expect(transitioned.body.data.oppStatus).toBe('20');
  });
});

describe('visit APIs', () => {
  it('creates a visit and returns aggregated visit rows', async () => {
    const opportunities = await request(app).get('/api/opportunities').expect(200);
    const opportunity = opportunities.body.data.items[0];

    await request(app)
      .post('/api/visits')
      .send({
        oppCode: opportunity.oppCode,
        custName: '不应使用的手填客户名',
        visitObject: '王总',
        visitTime: '2026-06-26',
        visitPurpose: '沟通报价和施工窗口',
        nextPlan: '下周提交方案',
        leaderName: '李主任',
        supportDemand: '技术支撑',
        remark: '客户反馈积极',
        photos: ['data:image/png;base64,AAA'],
      })
      .expect(201);

    const response = await request(app).get('/api/visits').expect(200);
    expect(response.body.data.items.some((item) => item.custName === opportunity.custName)).toBe(true);
    expect(response.body.data.items.some((item) => item.custName === '不应使用的手填客户名')).toBe(false);
  });

  it('rejects visit creation when opportunity code is not bound to an existing opportunity', async () => {
    const response = await request(app)
      .post('/api/visits')
      .send({
        oppCode: 'OP-NOT-FOUND',
        visitObject: '王总',
        visitTime: '2026-06-26',
        visitPurpose: '沟通报价和施工窗口',
      })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('关联商情不存在，请先选择有效商情');
  });
});

describe('customer APIs', () => {
  it('creates and lists customers', async () => {
    await request(app)
      .post('/api/customers')
      .send({
        custName: '新建客户股份有限公司',
        province: '上海',
        industry: '制造',
        creditCode: '91310000MA1TEST01X',
        custDesc: '重点拓展客户',
        contactName: '陈总',
        contactPhone: '13900139000',
      })
      .expect(201);

    const response = await request(app).get('/api/customers?keyword=新建客户').expect(200);
    expect(response.body.data.items[0].custName).toBe('新建客户股份有限公司');
  });
});

describe('dashboard API', () => {
  it('returns metric cards, funnel, visit trend, and type performance', async () => {
    const response = await request(app).get('/api/dashboard').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.metrics.totalOpportunities).toBeGreaterThan(0);
    expect(response.body.data.funnel.length).toBe(4);
    expect(response.body.data.visitTrend.length).toBeGreaterThan(0);
    expect(response.body.data.typePerformance.length).toBeGreaterThan(0);
  });
});

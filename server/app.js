import cors from 'cors';
import express from 'express';
import { createDatabase } from './db.js';
import { validateCustomerInput, validateOpportunityInput, validateVisitInput } from './domain.js';

function ok(data, status = 200) {
  return { status, body: { success: true, data, message: 'ok' } };
}

function fail(message, status = 400, data = null) {
  return { status, body: { success: false, data, message } };
}

function send(res, result) {
  res.status(result.status).json(result.body);
}

export async function createApp(options = {}) {
  const store = await createDatabase(options);
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '8mb' }));

  app.get('/api/health', (_req, res) => send(res, ok({ service: 'business-opportunity-system' })));
  app.get('/api/dictionaries', (_req, res) => send(res, ok(store.dictionaries)));
  app.get('/api/dashboard', (_req, res) => send(res, ok(store.getDashboard())));

  app.get('/api/opportunities', (req, res) => send(res, ok(store.listOpportunities(req.query))));

  app.post('/api/opportunities', (req, res) => {
    const validation = validateOpportunityInput(req.body);
    if (!validation.valid) return send(res, fail('商情表单校验失败', 422, validation.errors));
    return send(res, ok(store.createOpportunity(req.body), 201));
  });

  app.get('/api/opportunities/:id', (req, res) => {
    const detail = store.getOpportunity(req.params.id);
    if (!detail.opportunity) return send(res, fail('商情不存在', 404));
    return send(res, ok(detail));
  });

  app.put('/api/opportunities/:id', (req, res) => {
    const validation = validateOpportunityInput(req.body);
    if (!validation.valid) return send(res, fail('商情表单校验失败', 422, validation.errors));
    const updated = store.updateOpportunity(req.params.id, req.body);
    if (!updated) return send(res, fail('商情不存在', 404));
    return send(res, ok(updated));
  });

  app.patch('/api/opportunities/:id/status', (req, res) => {
    try {
      const updated = store.updateOpportunityStatus(req.params.id, req.body.action);
      if (!updated) return send(res, fail('商情不存在', 404));
      return send(res, ok(updated));
    } catch (error) {
      return send(res, fail(error.message, 422));
    }
  });

  app.get('/api/visits', (req, res) => send(res, ok(store.listVisits(req.query))));

  app.post('/api/visits', (req, res) => {
    const validation = validateVisitInput(req.body);
    if (!validation.valid) return send(res, fail('走访表单校验失败', 422, validation.errors));
    return send(res, ok(store.createVisit(req.body), 201));
  });

  app.get('/api/customers', (req, res) => send(res, ok(store.listCustomers(req.query))));

  app.post('/api/customers', (req, res) => {
    const validation = validateCustomerInput(req.body);
    if (!validation.valid) return send(res, fail('客户表单校验失败', 422, validation.errors));
    return send(res, ok(store.createCustomer(req.body), 201));
  });

  app.get('/api/customers/:code', (req, res) => {
    const customer = store.getCustomer(req.params.code);
    if (!customer) return send(res, fail('客户不存在', 404));
    return send(res, ok(customer));
  });

  app.put('/api/customers/:code', (req, res) => {
    const validation = validateCustomerInput(req.body);
    if (!validation.valid) return send(res, fail('客户表单校验失败', 422, validation.errors));
    const customer = store.updateCustomer(req.params.code, req.body);
    if (!customer) return send(res, fail('客户不存在', 404));
    return send(res, ok(customer));
  });

  return app;
}

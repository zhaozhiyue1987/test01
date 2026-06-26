import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { calculateProfitRate, transitionStatus } from './domain.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wasmPath = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
const defaultDbPath = path.join(__dirname, 'data', 'business.sqlite');

export const dictionaries = {
  statuses: [
    { value: '10', label: '商情发现' },
    { value: '20', label: '跟进中' },
    { value: '30', label: '商务洽谈' },
    { value: '40', label: '已转化' },
    { value: '90', label: '已终止' },
  ],
  ranks: [
    { value: '1', label: '一级（预计月收入 50 万以上）' },
    { value: '2', label: '二级' },
    { value: '3', label: '三级' },
    { value: '4', label: '四级（预计月收入 5 万以下）' },
  ],
  types: ['组网', '传输', '专线', '云网融合', '安全服务'],
  industries: ['金融', '制造', '互联网', '政企', '教育', '医疗', '能源'],
  provinces: ['北京', '上海', '广东', '浙江', '江苏', '四川'],
};

function mapRows(db, sql, params = {}) {
  const statement = db.prepare(sql);
  statement.bind(params);
  const rows = [];
  while (statement.step()) rows.push(statement.getAsObject());
  statement.free();
  return rows;
}

function run(db, sql, params = {}) {
  const statement = db.prepare(sql);
  statement.run(params);
  statement.free();
}

function one(db, sql, params = {}) {
  return mapRows(db, sql, params)[0] || null;
}

function nowIso() {
  return new Date().toISOString();
}

function dateOnly(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function toNumber(value) {
  return Number(value || 0);
}

function createCode(prefix, id) {
  return `${prefix}${new Date().getFullYear()}${String(id).padStart(5, '0')}`;
}

function normalizeOpportunity(row) {
  if (!row) return null;
  return {
    oppId: row.oppId,
    oppCode: row.oppCode,
    oppName: row.oppName,
    oppStatus: String(row.oppStatus),
    oppType: row.oppType,
    oppRank: String(row.oppRank),
    industry: row.industry,
    oppDesc: row.oppDesc,
    custRelation: row.custRelation,
    custCode: row.custCode,
    custName: row.custName,
    createName: row.createName,
    createDate: row.createDate,
    projInvest: toNumber(row.projInvest),
    proCost: toNumber(row.proCost),
    profitRate: toNumber(row.profitRate),
    terminalCost: toNumber(row.terminalCost),
    otherCost: toNumber(row.otherCost),
    signDate: row.signDate,
  };
}

export async function createDatabase(options = {}) {
  const SQL = await initSqlJs({ locateFile: () => wasmPath });
  const dbPath = options.dbPath || defaultDbPath;
  const shouldLoadFile = !options.inMemory && fs.existsSync(dbPath);
  const db = shouldLoadFile ? new SQL.Database(fs.readFileSync(dbPath)) : new SQL.Database();

  function persist() {
    if (options.inMemory) return;
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, Buffer.from(db.export()));
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS customer (
      cust_code TEXT PRIMARY KEY,
      cust_name TEXT NOT NULL,
      province TEXT,
      industry TEXT,
      credit_code TEXT,
      cust_desc TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      manager_name TEXT
    );
    CREATE TABLE IF NOT EXISTS opp (
      opp_id INTEGER PRIMARY KEY AUTOINCREMENT,
      opp_code TEXT UNIQUE,
      opp_name TEXT NOT NULL,
      opp_status TEXT NOT NULL,
      opp_type TEXT NOT NULL,
      opp_rank TEXT NOT NULL,
      indus_belong TEXT,
      opp_desc TEXT,
      cust_relation TEXT,
      cust_code TEXT,
      cust_name TEXT,
      create_user_id TEXT,
      create_name TEXT,
      create_date TEXT
    );
    CREATE TABLE IF NOT EXISTS opp_invest (
      opp_id INTEGER PRIMARY KEY,
      proj_invest REAL,
      pro_cost REAL,
      profit_rate REAL,
      terminal_cost REAL,
      other_cost REAL,
      sign_date TEXT
    );
    CREATE TABLE IF NOT EXISTS opp_contact (
      contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
      opp_id INTEGER,
      contact_name TEXT,
      contact_phone TEXT,
      contact_job TEXT,
      decision_influ TEXT,
      contact_type TEXT
    );
    CREATE TABLE IF NOT EXISTS visit (
      visit_id TEXT PRIMARY KEY,
      opp_code TEXT,
      cust_name TEXT,
      visit_object TEXT,
      visit_time TEXT,
      visit_purpose TEXT,
      next_plan TEXT,
      leader_name TEXT,
      support_demand TEXT,
      remark TEXT,
      create_time TEXT
    );
    CREATE TABLE IF NOT EXISTS visit_photo (
      photo_id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_id TEXT,
      photo_url TEXT
    );
  `);

  const customerCount = one(db, 'SELECT COUNT(*) AS count FROM customer').count;
  if (customerCount === 0) seed(db);
  persist();

  function getOpportunityRows() {
    return mapRows(
      db,
      `SELECT
        o.opp_id AS oppId, o.opp_code AS oppCode, o.opp_name AS oppName,
        o.opp_status AS oppStatus, o.opp_type AS oppType, o.opp_rank AS oppRank,
        o.indus_belong AS industry, o.opp_desc AS oppDesc,
        o.cust_relation AS custRelation, o.cust_code AS custCode,
        o.cust_name AS custName, o.create_name AS createName,
        o.create_date AS createDate, i.proj_invest AS projInvest,
        i.pro_cost AS proCost, i.profit_rate AS profitRate,
        i.terminal_cost AS terminalCost, i.other_cost AS otherCost,
        i.sign_date AS signDate
      FROM opp o
      LEFT JOIN opp_invest i ON i.opp_id = o.opp_id
      ORDER BY o.create_date DESC`
    ).map(normalizeOpportunity);
  }

  function applyOpportunityFilters(rows, query = {}) {
    const keyword = (query.keyword || '').trim().toLowerCase();
    return rows.filter((item) => {
      if (query.status && item.oppStatus !== String(query.status)) return false;
      if (query.rank && item.oppRank !== String(query.rank)) return false;
      if (query.type && item.oppType !== query.type) return false;
      if (query.industry && item.industry !== query.industry) return false;
      if (keyword) {
        const haystack = `${item.oppName} ${item.custName}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      return true;
    });
  }

  function listOpportunities(query = {}) {
    const rows = applyOpportunityFilters(getOpportunityRows(), query);
    const stats = {
      total: rows.length,
      active: rows.filter((item) => ['10', '20', '30'].includes(item.oppStatus)).length,
      converted: rows.filter((item) => item.oppStatus === '40').length,
      amountWan: Math.round((rows.reduce((sum, item) => sum + item.projInvest, 0) / 10000) * 100) / 100,
    };
    const stageCounts = { all: rows.length };
    dictionaries.statuses.forEach((status) => {
      stageCounts[status.value] = rows.filter((item) => item.oppStatus === status.value).length;
    });
    return { items: rows, stats, stageCounts };
  }

  function findCustomerByName(custName) {
    return one(
      db,
      `SELECT cust_code AS custCode, cust_name AS custName, province, industry,
        credit_code AS creditCode, cust_desc AS custDesc, contact_name AS contactName,
        contact_phone AS contactPhone, manager_name AS managerName
      FROM customer WHERE cust_name = :custName`,
      { ':custName': custName }
    );
  }

  function findCustomerByCode(custCode) {
    return getCustomer(custCode);
  }

  function findOpportunityByCode(oppCode) {
    return getOpportunityRows().find((item) => item.oppCode === oppCode) || null;
  }

  function createCustomer(input) {
    const next = one(db, 'SELECT COUNT(*) + 1 AS next FROM customer').next;
    const custCode = input.custCode || createCode('CU', next);
    run(
      db,
      `INSERT INTO customer
        (cust_code, cust_name, province, industry, credit_code, cust_desc, contact_name, contact_phone, manager_name)
       VALUES (:custCode, :custName, :province, :industry, :creditCode, :custDesc, :contactName, :contactPhone, :managerName)`,
      {
        ':custCode': custCode,
        ':custName': input.custName,
        ':province': input.province || '',
        ':industry': input.industry || '',
        ':creditCode': input.creditCode || '',
        ':custDesc': input.custDesc || '',
        ':contactName': input.contactName || '',
        ':contactPhone': input.contactPhone || '',
        ':managerName': input.managerName || '客户经理',
      }
    );
    persist();
    return getCustomer(custCode);
  }

  function createOpportunity(input) {
    const customer = findCustomerByCode(input.custCode);
    if (!customer) throw new Error('客户不存在，请先选择有效客户');
    const createDate = input.createDate || nowIso();
    run(
      db,
      `INSERT INTO opp
        (opp_code, opp_name, opp_status, opp_type, opp_rank, indus_belong, opp_desc,
         cust_relation, cust_code, cust_name, create_user_id, create_name, create_date)
       VALUES ('PENDING', :oppName, :oppStatus, :oppType, :oppRank, :industry, :oppDesc,
         :custRelation, :custCode, :custName, 'u001', :createName, :createDate)`,
      {
        ':oppName': input.oppName,
        ':oppStatus': input.oppStatus || '10',
        ':oppType': input.oppType,
        ':oppRank': input.oppRank,
        ':industry': customer.industry || '',
        ':oppDesc': input.oppDesc || '',
        ':custRelation': input.custRelation || '',
        ':custCode': customer.custCode,
        ':custName': customer.custName,
        ':createName': input.createName || '客户经理',
        ':createDate': createDate,
      }
    );
    const oppId = one(db, 'SELECT last_insert_rowid() AS id').id;
    const oppCode = input.oppCode || createCode('OP', oppId);
    run(db, 'UPDATE opp SET opp_code = :oppCode WHERE opp_id = :oppId', {
      ':oppCode': oppCode,
      ':oppId': oppId,
    });
    const profitRate = calculateProfitRate(input.projInvest, input.proCost);
    run(
      db,
      `INSERT INTO opp_invest
        (opp_id, proj_invest, pro_cost, profit_rate, terminal_cost, other_cost, sign_date)
       VALUES (:oppId, :projInvest, :proCost, :profitRate, :terminalCost, :otherCost, :signDate)`,
      {
        ':oppId': oppId,
        ':projInvest': toNumber(input.projInvest),
        ':proCost': toNumber(input.proCost),
        ':profitRate': profitRate,
        ':terminalCost': toNumber(input.terminalCost),
        ':otherCost': toNumber(input.otherCost),
        ':signDate': input.signDate || '',
      }
    );
    run(
      db,
      `INSERT INTO opp_contact
        (opp_id, contact_name, contact_phone, contact_job, decision_influ, contact_type)
       VALUES (:oppId, :contactName, :contactPhone, :contactJob, :decisionInflu, :contactType)`,
      {
        ':oppId': oppId,
        ':contactName': input.contactName,
        ':contactPhone': input.contactPhone,
        ':contactJob': input.contactJob || '',
        ':decisionInflu': input.decisionInflu || '',
        ':contactType': input.contactType || '',
      }
    );
    persist();
    return getOpportunity(oppId).opportunity;
  }

  function updateOpportunity(oppId, input) {
    const existing = getOpportunity(oppId).opportunity;
    if (!existing) return null;
    const customer = findCustomerByCode(input.custCode);
    if (!customer) throw new Error('客户不存在，请先选择有效客户');
    run(
      db,
      `UPDATE opp SET opp_name = :oppName, opp_type = :oppType, opp_rank = :oppRank,
        indus_belong = :industry, opp_desc = :oppDesc, cust_relation = :custRelation,
        cust_code = :custCode, cust_name = :custName
       WHERE opp_id = :oppId`,
      {
        ':oppId': oppId,
        ':oppName': input.oppName,
        ':oppType': input.oppType,
        ':oppRank': input.oppRank,
        ':industry': customer.industry || '',
        ':oppDesc': input.oppDesc || '',
        ':custRelation': input.custRelation || '',
        ':custCode': customer.custCode,
        ':custName': customer.custName,
      }
    );
    run(
      db,
      `UPDATE opp_invest SET proj_invest = :projInvest, pro_cost = :proCost,
        profit_rate = :profitRate, terminal_cost = :terminalCost,
        other_cost = :otherCost, sign_date = :signDate
       WHERE opp_id = :oppId`,
      {
        ':oppId': oppId,
        ':projInvest': toNumber(input.projInvest),
        ':proCost': toNumber(input.proCost),
        ':profitRate': calculateProfitRate(input.projInvest, input.proCost),
        ':terminalCost': toNumber(input.terminalCost),
        ':otherCost': toNumber(input.otherCost),
        ':signDate': input.signDate || '',
      }
    );
    run(db, 'DELETE FROM opp_contact WHERE opp_id = :oppId', { ':oppId': oppId });
    run(
      db,
      `INSERT INTO opp_contact
        (opp_id, contact_name, contact_phone, contact_job, decision_influ, contact_type)
       VALUES (:oppId, :contactName, :contactPhone, :contactJob, :decisionInflu, :contactType)`,
      {
        ':oppId': oppId,
        ':contactName': input.contactName,
        ':contactPhone': input.contactPhone,
        ':contactJob': input.contactJob || '',
        ':decisionInflu': input.decisionInflu || '',
        ':contactType': input.contactType || '',
      }
    );
    persist();
    return getOpportunity(oppId).opportunity;
  }

  function getOpportunity(oppId) {
    const opportunity = getOpportunityRows().find((item) => Number(item.oppId) === Number(oppId));
    if (!opportunity) return { opportunity: null };
    const contacts = mapRows(
      db,
      `SELECT contact_id AS contactId, contact_name AS contactName, contact_phone AS contactPhone,
        contact_job AS contactJob, decision_influ AS decisionInflu, contact_type AS contactType
       FROM opp_contact WHERE opp_id = :oppId`,
      { ':oppId': oppId }
    );
    const visits = getVisitsForOpportunity(opportunity.oppCode);
    return {
      opportunity,
      invest: {
        projInvest: opportunity.projInvest,
        proCost: opportunity.proCost,
        profitRate: opportunity.profitRate,
        terminalCost: opportunity.terminalCost,
        otherCost: opportunity.otherCost,
        signDate: opportunity.signDate,
      },
      contacts,
      visits,
    };
  }

  function updateOpportunityStatus(oppId, action) {
    const detail = getOpportunity(oppId);
    if (!detail.opportunity) return null;
    const next = transitionStatus(detail.opportunity.oppStatus, action);
    run(db, 'UPDATE opp SET opp_status = :next WHERE opp_id = :oppId', {
      ':next': next,
      ':oppId': oppId,
    });
    persist();
    return getOpportunity(oppId).opportunity;
  }

  function createVisit(input) {
    const opportunity = findOpportunityByCode(input.oppCode);
    if (!opportunity) throw new Error('关联商情不存在，请先选择有效商情');
    const next = one(db, 'SELECT COUNT(*) + 1 AS next FROM visit').next;
    const visitId = input.visitId || createCode('VI', next);
    run(
      db,
      `INSERT INTO visit
        (visit_id, opp_code, cust_name, visit_object, visit_time, visit_purpose,
         next_plan, leader_name, support_demand, remark, create_time)
       VALUES (:visitId, :oppCode, :custName, :visitObject, :visitTime, :visitPurpose,
         :nextPlan, :leaderName, :supportDemand, :remark, :createTime)`,
      {
        ':visitId': visitId,
        ':oppCode': input.oppCode || '',
        ':custName': opportunity.custName,
        ':visitObject': input.visitObject,
        ':visitTime': input.visitTime,
        ':visitPurpose': input.visitPurpose,
        ':nextPlan': input.nextPlan || '',
        ':leaderName': input.leaderName || '',
        ':supportDemand': input.supportDemand || '',
        ':remark': input.remark || '',
        ':createTime': input.createTime || nowIso(),
      }
    );
    (input.photos || []).forEach((photo) => {
      run(db, 'INSERT INTO visit_photo (visit_id, photo_url) VALUES (:visitId, :photoUrl)', {
        ':visitId': visitId,
        ':photoUrl': photo,
      });
    });
    persist();
    return getVisit(visitId);
  }

  function getVisit(visitId) {
    const visit = one(
      db,
      `SELECT visit_id AS visitId, opp_code AS oppCode, cust_name AS custName,
        visit_object AS visitObject, visit_time AS visitTime, visit_purpose AS visitPurpose,
        next_plan AS nextPlan, leader_name AS leaderName, support_demand AS supportDemand,
        remark, create_time AS createTime
       FROM visit WHERE visit_id = :visitId`,
      { ':visitId': visitId }
    );
    if (!visit) return null;
    visit.photos = mapRows(db, 'SELECT photo_url AS photoUrl FROM visit_photo WHERE visit_id = :visitId', {
      ':visitId': visitId,
    }).map((row) => row.photoUrl);
    return visit;
  }

  function getVisitsForOpportunity(oppCode) {
    return mapRows(
      db,
      `SELECT visit_id AS visitId, opp_code AS oppCode, cust_name AS custName,
        visit_object AS visitObject, visit_time AS visitTime, visit_purpose AS visitPurpose,
        next_plan AS nextPlan, leader_name AS leaderName, support_demand AS supportDemand,
        remark, create_time AS createTime
       FROM visit WHERE opp_code = :oppCode ORDER BY visit_time DESC`,
      { ':oppCode': oppCode }
    ).map((visit) => ({ ...visit, photos: getVisit(visit.visitId).photos }));
  }

  function listVisits(query = {}) {
    const rows = mapRows(
      db,
      `SELECT v.*, o.opp_name AS oppName
       FROM visit v
       LEFT JOIN opp o ON o.opp_code = v.opp_code
       ORDER BY v.visit_time DESC`
    );
    const keyword = (query.keyword || '').trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (!keyword) return true;
      return `${row.cust_name} ${row.oppName || ''}`.toLowerCase().includes(keyword);
    });
    const grouped = new Map();
    filtered.forEach((row) => {
      const key = `${row.cust_name}|${row.opp_code}`;
      const current = grouped.get(key) || {
        custName: row.cust_name,
        oppCode: row.opp_code,
        oppName: row.oppName || '',
        lastVisitObject: row.visit_object,
        lastVisitTime: row.visit_time,
        visitCount: 0,
        managerName: '客户经理',
        visitStatus: '未走访',
      };
      current.visitCount += 1;
      current.visitStatus = current.visitCount > 0 ? '已走访' : '未走访';
      if (row.visit_time > current.lastVisitTime) {
        current.lastVisitObject = row.visit_object;
        current.lastVisitTime = row.visit_time;
      }
      grouped.set(key, current);
    });
    return {
      items: [...grouped.values()],
      stats: {
        monthVisits: filtered.length,
        visitedCustomers: new Set(filtered.map((row) => row.cust_name)).size,
        pendingCustomers: Math.max(0, listCustomers().items.length - new Set(filtered.map((row) => row.cust_name)).size),
      },
    };
  }

  function getCustomer(custCode) {
    const customer = one(
      db,
      `SELECT cust_code AS custCode, cust_name AS custName, province, industry,
        credit_code AS creditCode, cust_desc AS custDesc, contact_name AS contactName,
        contact_phone AS contactPhone, manager_name AS managerName
       FROM customer WHERE cust_code = :custCode`,
      { ':custCode': custCode }
    );
    if (!customer) return null;
    customer.opportunities = getOpportunityRows().filter((item) => item.custCode === custCode);
    customer.visits = mapRows(
      db,
      `SELECT visit_id AS visitId, opp_code AS oppCode, cust_name AS custName,
        visit_object AS visitObject, visit_time AS visitTime, visit_purpose AS visitPurpose,
        next_plan AS nextPlan
       FROM visit WHERE cust_name = :custName ORDER BY visit_time DESC`,
      { ':custName': customer.custName }
    );
    return customer;
  }

  function listCustomers(query = {}) {
    const keyword = (query.keyword || '').trim().toLowerCase();
    let rows = mapRows(
      db,
      `SELECT cust_code AS custCode, cust_name AS custName, province, industry,
        credit_code AS creditCode, cust_desc AS custDesc, contact_name AS contactName,
        contact_phone AS contactPhone, manager_name AS managerName
       FROM customer ORDER BY cust_name`
    );
    rows = rows.filter((item) => {
      if (query.industry && item.industry !== query.industry) return false;
      if (query.province && item.province !== query.province) return false;
      if (!keyword) return true;
      return `${item.custName} ${item.creditCode || ''}`.toLowerCase().includes(keyword);
    });
    const opps = getOpportunityRows();
    const visits = mapRows(db, 'SELECT cust_name AS custName FROM visit');
    return {
      items: rows.map((item) => ({
        ...item,
        opportunityCount: opps.filter((opp) => opp.custCode === item.custCode).length,
        visitCount: visits.filter((visit) => visit.custName === item.custName).length,
      })),
    };
  }

  function updateCustomer(custCode, input) {
    run(
      db,
      `UPDATE customer SET cust_name = :custName, province = :province, industry = :industry,
        credit_code = :creditCode, cust_desc = :custDesc, contact_name = :contactName,
        contact_phone = :contactPhone WHERE cust_code = :custCode`,
      {
        ':custCode': custCode,
        ':custName': input.custName,
        ':province': input.province || '',
        ':industry': input.industry || '',
        ':creditCode': input.creditCode || '',
        ':custDesc': input.custDesc || '',
        ':contactName': input.contactName || '',
        ':contactPhone': input.contactPhone || '',
      }
    );
    persist();
    return getCustomer(custCode);
  }

  function getDashboard() {
    const opportunities = getOpportunityRows();
    const totalAmount = opportunities.reduce((sum, item) => sum + item.projInvest, 0);
    const converted = opportunities.filter((item) => item.oppStatus === '40');
    const active = opportunities.filter((item) => ['10', '20', '30'].includes(item.oppStatus));
    const funnel = ['10', '20', '30', '40'].map((status) => {
      const statusItems = opportunities.filter((item) => item.oppStatus === status);
      return {
        status,
        label: dictionaries.statuses.find((item) => item.value === status).label,
        count: statusItems.length,
        amount: statusItems.reduce((sum, item) => sum + item.projInvest, 0),
      };
    });
    const visits = mapRows(db, 'SELECT visit_time AS visitTime, cust_name AS custName FROM visit');
    const visitTrend = [-4, -3, -2, -1, 0].map((offset) => {
      const date = new Date();
      date.setMonth(date.getMonth() + offset);
      const month = date.toISOString().slice(0, 7);
      const monthVisits = visits.filter((visit) => String(visit.visitTime).startsWith(month));
      return {
        month,
        visits: monthVisits.length,
        customers: new Set(monthVisits.map((visit) => visit.custName)).size,
      };
    });
    const typePerformance = dictionaries.types.map((type) => {
      const typeItems = opportunities.filter((item) => item.oppType === type);
      const typeConverted = typeItems.filter((item) => item.oppStatus === '40');
      return {
        type,
        total: typeItems.length,
        converted: typeConverted.length,
        rate: typeItems.length ? Math.round((typeConverted.length / typeItems.length) * 100) : 0,
      };
    }).filter((item) => item.total > 0);
    return {
      metrics: {
        totalOpportunities: opportunities.length,
        activeOpportunities: active.length,
        convertedOpportunities: converted.length,
        totalAmountWan: Math.round((totalAmount / 10000) * 100) / 100,
        outputCustomers: new Set(opportunities.map((item) => item.custCode)).size,
        conversionRate: opportunities.length ? Math.round((converted.length / opportunities.length) * 100) : 0,
      },
      funnel,
      visitTrend,
      typePerformance,
    };
  }

  return {
    dictionaries,
    listOpportunities,
    createOpportunity,
    updateOpportunity,
    getOpportunity,
    findOpportunityByCode,
    updateOpportunityStatus,
    listVisits,
    createVisit,
    listCustomers,
    createCustomer,
    getCustomer,
    updateCustomer,
    getDashboard,
  };
}

function seed(db) {
  const customers = [
    ['CU202600001', '华东银行股份有限公司', '上海', '金融', '91310000100000001A', '核心金融行业客户', '王总', '13800138001', '客户经理'],
    ['CU202600002', '星河制造集团', '江苏', '制造', '91320000100000002B', '大型制造客户', '刘主任', '13800138002', '客户经理'],
    ['CU202600003', '云启科技有限公司', '浙江', '互联网', '91330000100000003C', '成长型互联网客户', '陈经理', '13800138003', '客户经理'],
    ['CU202600004', '城市教育发展中心', '北京', '教育', '91110000100000004D', '教育专网客户', '周老师', '010-88886666', '客户经理'],
  ];
  customers.forEach((row) => {
    run(
      db,
      `INSERT INTO customer VALUES (:custCode, :custName, :province, :industry, :creditCode, :custDesc, :contactName, :contactPhone, :managerName)`,
      {
        ':custCode': row[0],
        ':custName': row[1],
        ':province': row[2],
        ':industry': row[3],
        ':creditCode': row[4],
        ':custDesc': row[5],
        ':contactName': row[6],
        ':contactPhone': row[7],
        ':managerName': row[8],
      }
    );
  });

  const opportunities = [
    ['OP202600001', '华东银行灾备专线升级', '10', '专线', '1', '金融', '灾备中心专线扩容', '紧密', 'CU202600001', '华东银行股份有限公司', 860000, 520000, 12000, 8000, dateOnly(45), '王总', '13800138001', '信息科技部总监', '高', '决策人', -6],
    ['OP202600002', '星河制造园区组网', '20', '组网', '2', '制造', '多厂区互联组网', '良好', 'CU202600002', '星河制造集团', 420000, 260000, 9000, 5000, dateOnly(30), '刘主任', '13800138002', 'IT 负责人', '中', '业务联系人', -15],
    ['OP202600003', '云启科技传输链路', '30', '传输', '2', '互联网', '核心机房传输链路', '一般', 'CU202600003', '云启科技有限公司', 300000, 170000, 6000, 3000, dateOnly(20), '陈经理', '13800138003', '运维经理', '高', '技术联系人', -25],
    ['OP202600004', '教育中心云网融合', '40', '云网融合', '3', '教育', '教学平台云网融合', '良好', 'CU202600004', '城市教育发展中心', 180000, 90000, 3000, 2000, dateOnly(-5), '周老师', '010-88886666', '项目负责人', '中', '业务联系人', -35],
    ['OP202600005', '华东银行安全服务', '90', '安全服务', '3', '金融', '安全增值服务试点', '一般', 'CU202600001', '华东银行股份有限公司', 120000, 95000, 2000, 1500, dateOnly(60), '王总', '13800138001', '信息科技部总监', '高', '决策人', -50],
  ];
  opportunities.forEach((item, index) => {
    const oppId = index + 1;
    run(
      db,
      `INSERT INTO opp
        (opp_id, opp_code, opp_name, opp_status, opp_type, opp_rank, indus_belong, opp_desc,
         cust_relation, cust_code, cust_name, create_user_id, create_name, create_date)
       VALUES (:oppId, :oppCode, :oppName, :status, :type, :rank, :industry, :desc,
         :relation, :custCode, :custName, 'u001', '客户经理', :createDate)`,
      {
        ':oppId': oppId,
        ':oppCode': item[0],
        ':oppName': item[1],
        ':status': item[2],
        ':type': item[3],
        ':rank': item[4],
        ':industry': item[5],
        ':desc': item[6],
        ':relation': item[7],
        ':custCode': item[8],
        ':custName': item[9],
        ':createDate': new Date(Date.now() + item[20] * 86400000).toISOString(),
      }
    );
    run(
      db,
      `INSERT INTO opp_invest VALUES (:oppId, :income, :cost, :profit, :terminal, :other, :signDate)`,
      {
        ':oppId': oppId,
        ':income': item[10],
        ':cost': item[11],
        ':profit': calculateProfitRate(item[10], item[11]),
        ':terminal': item[12],
        ':other': item[13],
        ':signDate': item[14],
      }
    );
    run(
      db,
      `INSERT INTO opp_contact
        (opp_id, contact_name, contact_phone, contact_job, decision_influ, contact_type)
       VALUES (:oppId, :name, :phone, :job, :influ, :type)`,
      {
        ':oppId': oppId,
        ':name': item[15],
        ':phone': item[16],
        ':job': item[17],
        ':influ': item[18],
        ':type': item[19],
      }
    );
  });

  const visits = [
    ['VI202600001', 'OP202600001', '华东银行股份有限公司', '王总', dateOnly(-4), '确认灾备链路容量需求', '提交技术方案', '张总', '网络方案支撑', '客户关注割接窗口'],
    ['VI202600002', 'OP202600002', '星河制造集团', '刘主任', dateOnly(-12), '调研园区网络现状', '安排现场勘查', '', '售前支撑', '需要补充报价'],
    ['VI202600003', 'OP202600003', '云启科技有限公司', '陈经理', dateOnly(-20), '讨论机房传输冗余', '商务报价', '', '传输资源确认', '客户预算明确'],
  ];
  visits.forEach((visit) => {
    run(
      db,
      `INSERT INTO visit VALUES (:id, :oppCode, :custName, :object, :time, :purpose, :next, :leader, :support, :remark, :createTime)`,
      {
        ':id': visit[0],
        ':oppCode': visit[1],
        ':custName': visit[2],
        ':object': visit[3],
        ':time': visit[4],
        ':purpose': visit[5],
        ':next': visit[6],
        ':leader': visit[7],
        ':support': visit[8],
        ':remark': visit[9],
        ':createTime': nowIso(),
      }
    );
  });
}

import { useEffect, useMemo, useState } from 'react';
import { api, type DictionaryData } from '../api';
import { Button, ErrorState, Field, Input, Loading, PageHeader, Panel, Select, Textarea } from '../components/ui';

const emptyForm = {
  custName: '',
  industry: '',
  oppName: '',
  oppRank: '2',
  oppType: '专线',
  custRelation: '',
  oppDesc: '',
  projInvest: 0,
  proCost: 0,
  terminalCost: 0,
  otherCost: 0,
  signDate: '',
  contactName: '',
  contactPhone: '',
  contactJob: '',
  decisionInflu: '',
  contactType: '',
};

export default function OpportunityFormPage({ id, navigate }: { id?: string; navigate: (path: string) => void }) {
  const [dict, setDict] = useState<DictionaryData | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<Error | null>(null);
  const profitRate = useMemo(() => {
    const income = Number(form.projInvest || 0);
    const cost = Number(form.proCost || 0);
    return income > 0 ? Math.round(((income - cost) / income) * 10000) / 100 : 0;
  }, [form.projInvest, form.proCost]);

  useEffect(() => {
    api.dictionaries().then(setDict).catch(setError);
    if (id) {
      api.opportunity(id).then((detail) => {
        const contact = detail.contacts[0];
        setForm({
          custName: detail.opportunity.custName,
          industry: detail.opportunity.industry,
          oppName: detail.opportunity.oppName,
          oppRank: detail.opportunity.oppRank,
          oppType: detail.opportunity.oppType,
          custRelation: detail.opportunity.custRelation || '',
          oppDesc: detail.opportunity.oppDesc || '',
          projInvest: detail.opportunity.projInvest,
          proCost: detail.opportunity.proCost,
          terminalCost: detail.opportunity.terminalCost,
          otherCost: detail.opportunity.otherCost,
          signDate: detail.opportunity.signDate || '',
          contactName: contact?.contactName || '',
          contactPhone: contact?.contactPhone || '',
          contactJob: contact?.contactJob || '',
          decisionInflu: contact?.decisionInflu || '',
          contactType: contact?.contactType || '',
        });
      }).catch(setError);
    }
  }, [id]);

  function update(key: keyof typeof form, value: string | number) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const saved = id ? await api.updateOpportunity(id, form) : await api.createOpportunity(form);
      navigate(`/opportunities/${saved.oppId}`);
    } catch (caught) {
      setError(caught as Error);
    }
  }

  if (error) return <ErrorState error={error} />;
  if (!dict) return <Loading />;

  return (
    <form onSubmit={submit}>
      <PageHeader title={id ? '编辑商情' : '商情录入'} actions={<><Button variant="secondary" type="button" onClick={() => navigate('/opportunities')}>取消</Button><Button type="submit">保存</Button></>} />
      <div className="form-grid">
        <Panel title="客户信息">
          <Field label="客户名称" required><Input value={form.custName} onChange={(e) => update('custName', e.target.value)} /></Field>
          <Field label="行业类型"><Select value={form.industry} onChange={(e) => update('industry', e.target.value)}>{dict.industries.map((item) => <option key={item}>{item}</option>)}</Select></Field>
        </Panel>
        <Panel title="商机信息">
          <Field label="商机名称" required><Input value={form.oppName} maxLength={50} onChange={(e) => update('oppName', e.target.value)} /></Field>
          <Field label="商机等级" required><Select value={form.oppRank} onChange={(e) => update('oppRank', e.target.value)}>{dict.ranks.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</Select></Field>
          <Field label="商机类型" required><Select value={form.oppType} onChange={(e) => update('oppType', e.target.value)}>{dict.types.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="与客户关系"><Input value={form.custRelation} onChange={(e) => update('custRelation', e.target.value)} /></Field>
          <Field label="商机描述"><Textarea value={form.oppDesc} onChange={(e) => update('oppDesc', e.target.value)} /></Field>
        </Panel>
        <Panel title="费用信息">
          <Field label="预估收入(元)" required><Input type="number" min="0" value={form.projInvest} onChange={(e) => update('projInvest', Number(e.target.value))} /></Field>
          <Field label="预估成本(元)" required><Input type="number" min="0" value={form.proCost} onChange={(e) => update('proCost', Number(e.target.value))} /></Field>
          <Field label="预估利润率(%)"><Input readOnly value={profitRate} /></Field>
          <Field label="终端成本"><Input type="number" min="0" value={form.terminalCost} onChange={(e) => update('terminalCost', Number(e.target.value))} /></Field>
          <Field label="其他成本"><Input type="number" min="0" value={form.otherCost} onChange={(e) => update('otherCost', Number(e.target.value))} /></Field>
          <Field label="预计签约日期"><Input type="date" value={form.signDate} onChange={(e) => update('signDate', e.target.value)} /></Field>
        </Panel>
        <Panel title="联系人信息">
          <Field label="联系人名称" required><Input value={form.contactName} maxLength={20} onChange={(e) => update('contactName', e.target.value)} /></Field>
          <Field label="联系电话" required><Input value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} /></Field>
          <Field label="职位"><Input value={form.contactJob} onChange={(e) => update('contactJob', e.target.value)} /></Field>
          <Field label="决策影响力"><Input value={form.decisionInflu} onChange={(e) => update('decisionInflu', e.target.value)} /></Field>
          <Field label="联系人类别"><Input value={form.contactType} onChange={(e) => update('contactType', e.target.value)} /></Field>
        </Panel>
      </div>
    </form>
  );
}

import { useEffect, useState } from 'react';
import { api, type DictionaryData } from '../api';
import { Button, ErrorState, Field, Input, Loading, PageHeader, Panel, Select, Textarea } from '../components/ui';

const empty = {
  custName: '',
  province: '上海',
  industry: '互联网',
  creditCode: '',
  custDesc: '',
  contactName: '',
  contactPhone: '',
};

export default function CustomerFormPage({ code, navigate }: { code?: string; navigate: (path: string) => void }) {
  const [dict, setDict] = useState<DictionaryData | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    api.dictionaries().then(setDict).catch(setError);
    if (code) {
      api.customer(code).then((customer) => setForm({
        custName: customer.custName,
        province: customer.province,
        industry: customer.industry,
        creditCode: customer.creditCode || '',
        custDesc: customer.custDesc || '',
        contactName: customer.contactName || '',
        contactPhone: customer.contactPhone || '',
      })).catch(setError);
    }
  }, [code]);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const saved = code ? await api.updateCustomer(code, form) : await api.createCustomer(form);
      navigate(`/customers/${saved.custCode}`);
    } catch (caught) {
      setError(caught as Error);
    }
  }

  if (error) return <ErrorState error={error} />;
  if (!dict) return <Loading />;

  return (
    <form onSubmit={submit}>
      <PageHeader title={code ? '编辑客户' : '新增客户'} actions={<><Button variant="secondary" type="button" onClick={() => navigate('/customers')}>取消</Button><Button type="submit">保存</Button></>} />
      <div className="form-grid two">
        <Panel title="客户档案">
          <Field label="客户名称" required><Input value={form.custName} onChange={(event) => update('custName', event.target.value)} /></Field>
          <Field label="所属省份"><Select value={form.province} onChange={(event) => update('province', event.target.value)}>{dict.provinces.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="客户行业"><Select value={form.industry} onChange={(event) => update('industry', event.target.value)}>{dict.industries.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="统一社会信用代码"><Input value={form.creditCode} onChange={(event) => update('creditCode', event.target.value)} /></Field>
          <Field label="客户描述"><Textarea value={form.custDesc} onChange={(event) => update('custDesc', event.target.value)} /></Field>
        </Panel>
        <Panel title="联系人">
          <Field label="联系人姓名"><Input value={form.contactName} onChange={(event) => update('contactName', event.target.value)} /></Field>
          <Field label="联系电话"><Input value={form.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} /></Field>
        </Panel>
      </div>
    </form>
  );
}

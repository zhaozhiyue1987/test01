import { useEffect, useState } from 'react';
import { api, type Opportunity } from '../api';
import { Button, ErrorState, Field, Input, Loading, PageHeader, Panel, Select, Textarea } from '../components/ui';

export default function VisitFormPage({
  navigate,
  query,
}: {
  navigate: (path: string) => void;
  query: URLSearchParams;
}) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [form, setForm] = useState({
    oppCode: query.get('oppCode') || '',
    custName: query.get('custName') || '',
    visitObject: '',
    visitTime: new Date().toISOString().slice(0, 10),
    visitPurpose: '',
    nextPlan: '',
    leaderName: '',
    supportDemand: '',
    remark: '',
  });

  useEffect(() => {
    api.opportunities().then((result) => {
      setOpportunities(result.items);
      if (!form.oppCode && result.items[0]) {
        setForm((current) => ({ ...current, oppCode: result.items[0].oppCode, custName: result.items[0].custName }));
      }
    }).catch(setError);
  }, []);

  function update(key: keyof typeof form, value: string) {
    if (key === 'oppCode') {
      const selected = opportunities.find((item) => item.oppCode === value);
      setForm((current) => ({ ...current, oppCode: value, custName: selected?.custName || current.custName }));
      return;
    }
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function readPhotos(files: FileList | null) {
    if (!files) return;
    const selected = [...files].slice(0, 3);
    const encoded = await Promise.all(selected.map((file) => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    })));
    setPhotos(encoded);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.createVisit({ ...form, photos });
      navigate('/visits');
    } catch (caught) {
      setError(caught as Error);
    }
  }

  if (error) return <ErrorState error={error} />;
  if (!opportunities.length) return <Loading />;

  const readonlyLinked = Boolean(query.get('oppCode'));

  return (
    <form onSubmit={submit}>
      <PageHeader title="新增客户走访" actions={<><Button variant="secondary" type="button" onClick={() => navigate('/visits')}>取消</Button><Button type="submit">提交</Button></>} />
      <div className="form-grid two">
        <Panel title="基本信息">
          <Field label="关联商情">
            <Select disabled={readonlyLinked} value={form.oppCode} onChange={(event) => update('oppCode', event.target.value)}>
              {opportunities.map((item) => <option value={item.oppCode} key={item.oppCode}>{item.oppName}</option>)}
            </Select>
          </Field>
          <Field label="走访客户"><Input readOnly value={form.custName} /></Field>
          <Field label="走访对象" required><Input value={form.visitObject} onChange={(event) => update('visitObject', event.target.value)} /></Field>
          <Field label="走访时间" required><Input type="date" value={form.visitTime} onChange={(event) => update('visitTime', event.target.value)} /></Field>
        </Panel>
        <Panel title="走访内容">
          <Field label="走访目的" required><Textarea value={form.visitPurpose} onChange={(event) => update('visitPurpose', event.target.value)} /></Field>
          <Field label="下一步计划"><Textarea value={form.nextPlan} onChange={(event) => update('nextPlan', event.target.value)} /></Field>
        </Panel>
        <Panel title="其他信息">
          <Field label="陪访领导"><Input value={form.leaderName} onChange={(event) => update('leaderName', event.target.value)} /></Field>
          <Field label="支撑需求"><Input value={form.supportDemand} onChange={(event) => update('supportDemand', event.target.value)} /></Field>
          <Field label="备注"><Textarea value={form.remark} onChange={(event) => update('remark', event.target.value)} /></Field>
        </Panel>
        <Panel title="现场照片">
          <Field label="最多 3 张"><Input type="file" accept="image/*" multiple onChange={(event) => readPhotos(event.target.files)} /></Field>
          <div className="photo-strip">
            {photos.map((photo) => <img alt="现场照片预览" src={photo} key={photo} />)}
          </div>
        </Panel>
      </div>
    </form>
  );
}

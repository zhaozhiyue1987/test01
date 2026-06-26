import { useEffect, useState } from 'react';
import { api, formatDate, type OpportunityDetail } from '../api';
import { Button, ErrorState, Loading, PageHeader, Panel, StatusTag, Tabs } from '../components/ui';

export default function OpportunityDetailPage({ id, navigate }: { id: string; navigate: (path: string) => void }) {
  const [detail, setDetail] = useState<OpportunityDetail | null>(null);
  const [tab, setTab] = useState('info');
  const [error, setError] = useState<Error | null>(null);

  function load() {
    api.opportunity(id).then(setDetail).catch(setError);
  }

  useEffect(load, [id]);

  async function transition(action: string) {
    if (!window.confirm('确认执行该状态操作？')) return;
    await api.transitionOpportunity(id, action);
    load();
  }

  if (error) return <ErrorState error={error} />;
  if (!detail) return <Loading />;

  const item = detail.opportunity;
  const active = ['10', '20', '30'].includes(item.oppStatus);

  return (
    <>
      <PageHeader
        title={item.oppName}
        description={`${item.oppCode} · ${item.custName} · ${formatDate(item.createDate)}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/opportunities')}>返回</Button>
            <Button variant="secondary" onClick={() => navigate(`/opportunities/${id}/edit`)}>编辑</Button>
            <Button disabled={!active} onClick={() => navigate(`/visits/new?oppCode=${item.oppCode}&custName=${encodeURIComponent(item.custName)}`)}>新增走访</Button>
            {item.oppStatus === '90' ? <Button onClick={() => transition('reactivate')}>重新激活</Button> : null}
            {active ? <Button variant="danger" onClick={() => transition('terminate')}>终止商情</Button> : null}
          </>
        }
      />
      <Panel>
        <div className="detail-hero">
          <StatusTag status={item.oppStatus} />
          <div className="progress-line">
            {['10', '20', '30', '40', '90'].map((status) => (
              <div className={`progress-step ${item.oppStatus === status ? 'active' : ''}`} key={status}>
                <span />
                <b>{{ '10': '商情发现', '20': '跟进中', '30': '商务洽谈', '40': '已转化', '90': '已终止' }[status]}</b>
              </div>
            ))}
          </div>
          <div className="inline-actions">
            <Button disabled={!['10', '20', '30'].includes(item.oppStatus)} onClick={() => transition('advance')}>推进</Button>
            <Button variant="secondary" disabled={!['20', '30'].includes(item.oppStatus)} onClick={() => transition('rollback')}>退回</Button>
          </div>
        </div>
      </Panel>
      <Tabs tabs={[{ value: 'info', label: '业务信息' }, { value: 'visits', label: `客户走访 ${detail.visits.length}` }]} value={tab} onChange={setTab} />
      {tab === 'info' ? (
        <div className="detail-grid">
          <Panel title="基本信息">
            <Description rows={[
              ['客户名称', item.custName], ['行业类型', item.industry], ['商机类型', item.oppType], ['商机等级', `${item.oppRank}级`],
              ['与客户关系', item.custRelation || '-'], ['商机描述', item.oppDesc || '-'],
            ]} />
          </Panel>
          <Panel title="费用信息">
            <Description rows={[
              ['预估收入', `${item.projInvest.toLocaleString('zh-CN')} 元`], ['预估成本', `${item.proCost.toLocaleString('zh-CN')} 元`],
              ['预估利润率', `${item.profitRate}%`], ['终端成本', `${item.terminalCost.toLocaleString('zh-CN')} 元`],
              ['其他成本', `${item.otherCost.toLocaleString('zh-CN')} 元`], ['预计签约日期', item.signDate || '-'],
            ]} />
          </Panel>
          <Panel title="联系人信息">
            <Description rows={detail.contacts.flatMap((contact) => [
              ['联系人姓名', contact.contactName], ['联系电话', contact.contactPhone], ['职位', contact.contactJob || '-'],
              ['决策影响力', contact.decisionInflu || '-'], ['联系人类别', contact.contactType || '-'],
            ])} />
          </Panel>
        </div>
      ) : (
        <Panel title="走访时间线" actions={<Button onClick={() => navigate(`/visits/new?oppCode=${item.oppCode}&custName=${encodeURIComponent(item.custName)}`)}>新增客户走访</Button>}>
          <div className="timeline">
            {detail.visits.length === 0 ? <p className="muted-text">暂无走访记录</p> : detail.visits.map((visit, index) => (
              <article className="timeline-item" key={visit.visitId}>
                <span className="timeline-index">{index + 1}</span>
                <div>
                  <strong>{visit.visitObject} · {formatDate(visit.visitTime)}</strong>
                  <p>{visit.visitPurpose}</p>
                  <p className="muted-text">下一步：{visit.nextPlan || '-'}</p>
                  <p className="muted-text">备注：{visit.remark || '-'}</p>
                  <div className="photo-strip">
                    {(visit.photos || []).map((photo) => <img alt="现场附件" key={photo} src={photo} />)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}

function Description({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="description-list">
      {rows.map(([label, value], index) => (
        <div key={`${label}-${index}`}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

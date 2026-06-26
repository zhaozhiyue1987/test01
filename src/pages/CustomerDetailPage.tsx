import { useEffect, useState } from 'react';
import { api, formatDate, type Customer } from '../api';
import { Button, ErrorState, Loading, PageHeader, Panel, StatusTag } from '../components/ui';

export default function CustomerDetailPage({ code, navigate }: { code: string; navigate: (path: string) => void }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    api.customer(code).then(setCustomer).catch(setError);
  }, [code]);

  if (error) return <ErrorState error={error} />;
  if (!customer) return <Loading />;

  return (
    <>
      <PageHeader title={customer.custName} description={`${customer.custCode} · ${customer.industry} · ${customer.province}`} actions={<><Button variant="secondary" onClick={() => navigate('/customers')}>返回</Button><Button onClick={() => navigate(`/customers/${code}/edit`)}>编辑</Button></>} />
      <div className="detail-grid">
        <Panel title="基本信息">
          <dl className="description-list">
            <div><dt>统一社会信用代码</dt><dd>{customer.creditCode || '-'}</dd></div>
            <div><dt>联系人</dt><dd>{customer.contactName}</dd></div>
            <div><dt>联系电话</dt><dd>{customer.contactPhone}</dd></div>
            <div><dt>客户经理</dt><dd>{customer.managerName}</dd></div>
            <div><dt>客户描述</dt><dd>{customer.custDesc || '-'}</dd></div>
          </dl>
        </Panel>
        <Panel title="关联商情">
          <table className="data-table compact">
            <tbody>
              {(customer.opportunities || []).map((item) => (
                <tr key={item.oppId}><td>{item.oppName}</td><td><StatusTag status={item.oppStatus} /></td><td>{item.projInvest.toLocaleString('zh-CN')} 元</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="走访记录">
          <table className="data-table compact">
            <tbody>
              {(customer.visits || []).map((item) => (
                <tr key={item.visitId}><td>{formatDate(item.visitTime)}</td><td>{item.visitObject}</td><td>{item.visitPurpose}</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}

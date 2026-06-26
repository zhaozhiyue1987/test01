import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, formatDate, type VisitAggregate } from '../api';
import { Button, Empty, ErrorState, Input, Loading, PageHeader, Panel, StatCard } from '../components/ui';

export default function VisitsPage({ navigate }: { navigate: (path: string) => void }) {
  const [keyword, setKeyword] = useState('');
  const [items, setItems] = useState<VisitAggregate[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
    api.visits(query).then((result) => {
      setItems(result.items);
      setStats(result.stats);
    }).catch(setError);
  }, [keyword]);

  if (error) return <ErrorState error={error} />;
  if (!items) return <Loading />;

  return (
    <>
      <PageHeader title="客户走访" description="按客户聚合查看走访覆盖和最近跟进。" actions={<Button onClick={() => navigate('/visits/new')}>新增走访</Button>} />
      <div className="stat-grid">
        <StatCard label="本月走访次数" value={stats.monthVisits || 0} />
        <StatCard label="已走访客户" value={stats.visitedCustomers || 0} tone="green" />
        <StatCard label="待走访客户" value={stats.pendingCustomers || 0} tone="orange" />
        <StatCard label="人均走访" value={`${stats.visitedCustomers ? Math.round(((stats.monthVisits || 0) / stats.visitedCustomers) * 10) / 10 : 0} 次/客户`} tone="purple" />
      </div>
      <Panel>
        <div className="filter-row">
          <div className="search-control">
            <Search size={16} />
            <Input placeholder="搜索客户名称 / 关联商情" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          </div>
        </div>
      </Panel>
      <Panel title="走访记录">
        {items.length === 0 ? <Empty /> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>客户名称</th>
                <th>关联商情</th>
                <th>最近走访对象</th>
                <th>最近走访时间</th>
                <th>累计次数</th>
                <th>客户经理</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.custName}-${item.oppCode}`}>
                  <td className="strong-cell">{item.custName}</td>
                  <td>{item.oppName || item.oppCode}</td>
                  <td>{item.lastVisitObject}</td>
                  <td>{formatDate(item.lastVisitTime)}</td>
                  <td><span className="count-badge">{item.visitCount}</span></td>
                  <td>{item.managerName}</td>
                  <td>{item.visitStatus}</td>
                  <td className="table-actions">
                    <button onClick={() => navigate(`/visits/new?oppCode=${item.oppCode}&custName=${encodeURIComponent(item.custName)}`)} type="button">新增</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}

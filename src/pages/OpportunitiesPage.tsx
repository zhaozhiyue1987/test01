import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api, formatDate, type DictionaryData, type Opportunity } from '../api';
import { Button, Empty, ErrorState, Input, Loading, PageHeader, Panel, Select, StatCard, StatusTag } from '../components/ui';

export default function OpportunitiesPage({ navigate }: { navigate: (path: string) => void }) {
  const [dict, setDict] = useState<DictionaryData | null>(null);
  const [items, setItems] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState({ keyword: '', status: '', rank: '', type: '', industry: '' });
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString() ? `?${params}` : '';
  }, [filters]);

  function load() {
    setLoading(true);
    Promise.all([api.dictionaries(), api.opportunities(query)])
      .then(([dictionaries, result]) => {
        setDict(dictionaries);
        setItems(result.items);
        setStats(result.stats);
        setStageCounts(result.stageCounts);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }

  useEffect(load, [query]);

  async function transition(id: number, action: string) {
    const message = action === 'terminate' ? '确认终止该商情？' : '确认执行阶段流转？';
    if (!window.confirm(message)) return;
    await api.transitionOpportunity(id, action);
    load();
  }

  if (error) return <ErrorState error={error} />;
  if (!dict || loading) return <Loading />;

  return (
    <>
      <PageHeader
        title="商情跟踪"
        description="管理商情发现、跟进、洽谈、转化与终止全过程。"
        actions={<Button onClick={() => navigate('/opportunities/new')}>新增商情</Button>}
      />
      <div className="stat-grid">
        <StatCard label="商情总数" value={stats.total || 0} />
        <StatCard label="进行中" value={stats.active || 0} tone="orange" />
        <StatCard label="已转化" value={stats.converted || 0} tone="green" />
        <StatCard label="预估金额" value={`${stats.amountWan || 0} 万`} tone="purple" />
      </div>
      <Panel>
        <div className="stage-filter">
          <button className={!filters.status ? 'active' : ''} onClick={() => setFilters({ ...filters, status: '' })} type="button">
            全部<span>{stageCounts.all || 0}</span>
          </button>
          {dict.statuses.map((status) => (
            <button
              className={filters.status === status.value ? 'active' : ''}
              key={status.value}
              onClick={() => setFilters({ ...filters, status: status.value })}
              type="button"
            >
              {status.label}<span>{stageCounts[status.value] || 0}</span>
            </button>
          ))}
        </div>
        <div className="filter-row">
          <div className="search-control">
            <Search size={16} />
            <Input placeholder="搜索商机名称 / 客户名称" value={filters.keyword} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} />
          </div>
          <Select value={filters.rank} onChange={(event) => setFilters({ ...filters, rank: event.target.value })}>
            <option value="">全部等级</option>
            {dict.ranks.map((rank) => <option value={rank.value} key={rank.value}>{rank.label}</option>)}
          </Select>
          <Select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
            <option value="">全部类型</option>
            {dict.types.map((type) => <option value={type} key={type}>{type}</option>)}
          </Select>
          <Select value={filters.industry} onChange={(event) => setFilters({ ...filters, industry: event.target.value })}>
            <option value="">全部行业</option>
            {dict.industries.map((industry) => <option value={industry} key={industry}>{industry}</option>)}
          </Select>
        </div>
      </Panel>
      <Panel title="商情列表">
        {items.length === 0 ? <Empty /> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>商机名称</th>
                <th>客户名称</th>
                <th>等级</th>
                <th>类型</th>
                <th>当前阶段</th>
                <th>预估金额</th>
                <th>客户经理</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const finalStatus = ['40', '90'].includes(item.oppStatus);
                return (
                  <tr key={item.oppId}>
                    <td className="strong-cell">{item.oppName}</td>
                    <td>{item.custName}</td>
                    <td>{item.oppRank}级</td>
                    <td>{item.oppType}</td>
                    <td><StatusTag status={item.oppStatus} /></td>
                    <td>{item.projInvest.toLocaleString('zh-CN')} 元</td>
                    <td>{item.createName}</td>
                    <td>{formatDate(item.createDate)}</td>
                    <td className="table-actions">
                      <button onClick={() => navigate(`/opportunities/${item.oppId}`)} type="button">详情</button>
                      <button disabled={finalStatus} onClick={() => navigate(`/visits/new?oppCode=${item.oppCode}&custName=${encodeURIComponent(item.custName)}`)} type="button">跟进</button>
                      <button disabled={finalStatus} onClick={() => transition(item.oppId, 'terminate')} type="button">终止</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}

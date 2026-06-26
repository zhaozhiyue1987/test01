import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, type Customer, type DictionaryData } from '../api';
import { Button, Empty, ErrorState, Input, Loading, PageHeader, Panel, Select } from '../components/ui';

export default function CustomersPage({ navigate }: { navigate: (path: string) => void }) {
  const [dict, setDict] = useState<DictionaryData | null>(null);
  const [items, setItems] = useState<Customer[]>([]);
  const [filters, setFilters] = useState({ keyword: '', industry: '', province: '' });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    Promise.all([api.dictionaries(), api.customers(params.toString() ? `?${params}` : '')])
      .then(([dictionaries, result]) => {
        setDict(dictionaries);
        setItems(result.items);
      }).catch(setError);
  }, [filters]);

  if (error) return <ErrorState error={error} />;
  if (!dict) return <Loading />;

  return (
    <>
      <PageHeader title="客户管理" description="维护客户档案，查看关联商情与走访情况。" actions={<Button onClick={() => navigate('/customers/new')}>新增客户</Button>} />
      <Panel>
        <div className="filter-row">
          <div className="search-control"><Search size={16} /><Input placeholder="搜索客户名称 / 信用代码" value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} /></div>
          <Select value={filters.industry} onChange={(e) => setFilters({ ...filters, industry: e.target.value })}><option value="">全部行业</option>{dict.industries.map((item) => <option key={item}>{item}</option>)}</Select>
          <Select value={filters.province} onChange={(e) => setFilters({ ...filters, province: e.target.value })}><option value="">全部省份</option>{dict.provinces.map((item) => <option key={item}>{item}</option>)}</Select>
        </div>
      </Panel>
      <Panel title="客户列表">
        {items.length === 0 ? <Empty /> : (
          <table className="data-table">
            <thead>
              <tr><th>客户名称</th><th>客户编号</th><th>行业</th><th>省份</th><th>联系人</th><th>关联商情</th><th>累计走访</th><th>操作</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.custCode}>
                  <td className="strong-cell">{item.custName}</td>
                  <td>{item.custCode}</td>
                  <td>{item.industry}</td>
                  <td>{item.province}</td>
                  <td>{item.contactName}</td>
                  <td>{item.opportunityCount}</td>
                  <td>{item.visitCount}</td>
                  <td className="table-actions">
                    <button onClick={() => navigate(`/customers/${item.custCode}`)} type="button">详情</button>
                    <button onClick={() => navigate(`/customers/${item.custCode}/edit`)} type="button">编辑</button>
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

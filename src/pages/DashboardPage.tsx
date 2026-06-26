import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Funnel, FunnelChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, type DashboardData } from '../api';
import { ErrorState, Loading, PageHeader, Panel, StatCard } from '../components/ui';

export default function DashboardPage({ navigate }: { navigate: (path: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    api.dashboard().then(setData).catch(setError);
  }, []);

  if (error) return <ErrorState error={error} />;
  if (!data) return <Loading />;

  return (
    <>
      <PageHeader title="数据看板" description="单人视角查看商情、转化和走访表现。" />
      <div className="stat-grid six">
        <StatCard label="总商情数" value={data.metrics.totalOpportunities} />
        <StatCard label="进行中商情" value={data.metrics.activeOpportunities} tone="orange" />
        <StatCard label="已转化商情" value={data.metrics.convertedOpportunities} tone="green" />
        <StatCard label="总商情金额" value={`${data.metrics.totalAmountWan} 万`} tone="purple" />
        <StatCard label="产出客户数" value={data.metrics.outputCustomers} />
        <StatCard label="商情转化率" value={`${data.metrics.conversionRate}%`} tone="green" />
      </div>
      <div className="dashboard-grid">
        <Panel title="转化漏斗">
          <div className="chart-box">
            <ResponsiveContainer>
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="count" data={data.funnel} nameKey="label">
                  {data.funnel.map((_, index) => (
                    <Cell key={index} fill={['#2563EB', '#0EA5E9', '#A855F7', '#EC4899'][index]} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="走访趋势">
          <div className="chart-box">
            <ResponsiveContainer>
              <BarChart data={data.visitTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="visits" name="走访次数" fill="#2F88FF" />
                <Bar dataKey="customers" name="覆盖客户" fill="#07C160" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
      <Panel
        title="业绩盘"
        actions={<button className="text-link" onClick={() => navigate('/opportunities')} type="button">查看商情</button>}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>商机类型</th>
              <th>商情数</th>
              <th>已转化</th>
              <th>转化率</th>
            </tr>
          </thead>
          <tbody>
            {data.typePerformance.map((item) => (
              <tr key={item.type}>
                <td>{item.type}</td>
                <td>{item.total}</td>
                <td>{item.converted}</td>
                <td>{item.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

import { BarChart3, BriefcaseBusiness, Building2, CalendarCheck } from 'lucide-react';
import type { ReactNode } from 'react';

const navItems = [
  { path: '/dashboard', label: '数据看板', icon: BarChart3 },
  { path: '/opportunities', label: '商情跟踪', icon: BriefcaseBusiness },
  { path: '/visits', label: '客户走访', icon: CalendarCheck },
  { path: '/customers', label: '客户管理', icon: Building2 },
];

export function Layout({
  route,
  children,
  navigate,
}: {
  route: string;
  children: ReactNode;
  navigate: (path: string) => void;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">商</div>
          <div>
            <strong>商情管理系统</strong>
            <span>客户经理工作台</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = route.startsWith(item.path);
            return (
              <button
                className={`nav-item ${active ? 'active' : ''}`}
                key={item.path}
                onClick={() => navigate(item.path)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}

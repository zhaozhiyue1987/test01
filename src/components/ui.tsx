import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function Button({ variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  return <button {...props} className={`btn btn-${variant} ${props.className || ''}`} />;
}

export function StatCard({ label, value, tone = 'blue' }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function Panel({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="panel">
      {title || actions ? (
        <div className="panel-header">
          {title ? <h2>{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Loading() {
  return <div className="state-box">加载中...</div>;
}

export function Empty({ text = '暂无数据' }: { text?: string }) {
  return <div className="state-box muted-text">{text}</div>;
}

export function ErrorState({ error }: { error: Error }) {
  return <div className="state-box error-text">{error.message}</div>;
}

export function StatusTag({ status }: { status: string }) {
  const labelMap: Record<string, string> = {
    '10': '商情发现',
    '20': '跟进中',
    '30': '商务洽谈',
    '40': '已转化',
    '90': '已终止',
  };
  return <span className={`status-tag status-${status}`}>{labelMap[status] || status}</span>;
}

export function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required ? <b>*</b> : null}
      </span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`control ${props.className || ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`control ${props.className || ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`control textarea ${props.className || ''}`} />;
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button className={value === tab.value ? 'active' : ''} key={tab.value} onClick={() => onChange(tab.value)} type="button">
          {tab.label}
        </button>
      ))}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import { Network } from 'lucide-react';
import { api } from '@/lib/api';

interface OrgNode {
  id: number;
  employee_id: string;
  full_name: string;
  designation: string;
  department_name: string;
  reporting_manager_id: number | null;
  employment_status: string;
}

function OrgCard({ node, children }: { node: OrgNode; children?: React.ReactNode }) {
  const router = useRouter();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        className="card"
        style={{ width: 180, padding: '12px 16px', cursor: 'pointer', textAlign: 'center', borderTop: '3px solid var(--primary)' }}
        onClick={() => router.push(`/employees/${node.id}`)}
      >
        <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 14, margin: '0 auto 8px' }}>
          {getInitials(node.full_name)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{node.full_name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{node.designation}</div>
        <div style={{ fontSize: 10, color: 'var(--primary)', marginTop: 4 }}>{node.department_name}</div>
      </div>
      {children && (
        <div style={{ display: 'flex', gap: 16, marginTop: 0, position: 'relative', paddingTop: 24 }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', width: 2, height: 24, background: 'var(--border)', transform: 'translateX(-50%)' }}></div>
          {children}
        </div>
      )}
    </div>
  );
}

function buildTree(nodes: OrgNode[], parentId: number | null): OrgNode[] {
  return nodes.filter(n => n.reporting_manager_id === parentId);
}

function RenderTree({ nodes, all }: { nodes: OrgNode[]; all: OrgNode[] }) {
  if (!nodes.length) return null;
  return (
    <>
      {nodes.map(node => {
        const children = buildTree(all, node.id);
        return (
          <OrgCard key={node.id} node={node}>
            {children.length > 0 && <RenderTree nodes={children} all={all} />}
          </OrgCard>
        );
      })}
    </>
  );
}

export default function OrgChartPage() {
  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOrgChart()
      .then((data: any) => setNodes(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  const roots = buildTree(nodes, null);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
            <Network size={28} strokeWidth={2} />
          </div>
          <h1 style={{ margin: 0 }}>Org Chart</h1>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>{nodes.length} employees · Click a card to view profile</div>
      </div>
      <div className="card org-chart-card" style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', minWidth: 'max-content' }}>
          <RenderTree nodes={roots} all={nodes} />
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { api } from '../api';
import { Loading, useLoad } from '../components/ui';
import { money } from '../labels';

interface Node {
  kind: 'network' | 'center' | 'hall' | 'section';
  id: number | null;
  name: string;
  details: string;
  sectionCount: number;
  capacity: number;
  minPrice: number | null;
  children: Node[];
}

function Tree({ node }: { node: Node }) {
  const title = node.kind === 'section' ? <Link to={`/sections/${node.id}`}>{node.name}</Link>
    : node.kind === 'hall' ? <Link to={`/halls/${node.id}`}>{node.name}</Link> : node.name;
  return (
    <li className={`node node-${node.kind}`}>
      <div className="node-head">
        <span className="node-title">{title}</span>
        <span className="muted small">{node.details}</span>
        {node.kind !== 'section' && (
          <span className="small node-stats">секцій: {node.sectionCount}{node.minPrice !== null && `, від ${money(node.minPrice)}`}</span>
        )}
      </div>
      {node.children.length > 0 && <ul>{node.children.map((c) => <Tree key={`${c.kind}-${c.id}`} node={c} />)}</ul>}
    </li>
  );
}

export default function Network() {
  const { data } = useLoad(() => api<Node>('/catalog/structure'));
  if (!data) return <Loading />;
  return (
    <>
      <h1>Мережа центрів</h1>
      <p className="muted">Центри, зали та секції мережі. Загалом секцій: {data.sectionCount}, місць у групах: {data.capacity}.</p>
      <ul className="tree panel" data-testid="network-tree"><Tree node={data} /></ul>
    </>
  );
}

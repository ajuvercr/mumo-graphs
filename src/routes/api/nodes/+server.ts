import { text } from '@sveltejs/kit';
import { find_nodes, type Nodes } from '@ajuvercr/mumo-pipeline';

export function GET() {
  const nodes: Nodes = {};
  find_nodes(nodes, true);

  return text(JSON.stringify(nodes));
}

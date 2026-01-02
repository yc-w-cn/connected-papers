'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import type { Node, Link, NodeType } from '@/types/data';

interface NetworkGraphProps {
  data: {
    nodes: Node[];
    links: Link[];
  };
}

interface EnrichedNode extends Node {
  averageCitation: number;
}

interface EnrichedLink {
  source: string;
  target: string;
  type: 'published' | 'cited' | 'appeared_in';
}

export const NODE_COLORS: Record<NodeType, string> = {
  author: '#007AFF',
  paper: '#FF9500',
  venue: '#FF3B30',
};

export const NODE_LABELS: Record<NodeType, string> = {
  author: '作者',
  paper: '论文',
  venue: '期刊/会议',
};

const NODE_SIZE_BASE = 5;
const NODE_SIZE_MULTIPLIER = 0.5;

function getNodeSize(citationCount: number = 0): number {
  return NODE_SIZE_BASE + Math.sqrt(citationCount) * NODE_SIZE_MULTIPLIER;
}

function calculateAverageCitations(
  node: Node,
  nodes: Node[],
  links: Link[]
): number {
  if (node.type === 'paper') {
    return node.citationCount || 0;
  }

  const relatedLinks = links.filter(
    (link) => link.source === node.id || link.target === node.id
  );

  const paperIds = relatedLinks
    .map((link) => {
      if (link.source === node.id) {
        return link.target as string;
      } else {
        return link.source as string;
      }
    })
    .filter((id) => {
      const relatedNode = nodes.find((n) => n.id === id);
      return relatedNode?.type === 'paper';
    });

  if (paperIds.length === 0) {
    return 0;
  }

  const citations = paperIds
    .map((id) => {
      const paperNode = nodes.find((n) => n.id === id);
      return paperNode?.citationCount || 0;
    })
    .filter((count) => count > 0);

  if (citations.length === 0) {
    return 0;
  }

  const sum = citations.reduce((acc, count) => acc + count, 0);
  return Math.round(sum / citations.length);
}

export function NetworkGraph({ data }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const enrichedNodes: EnrichedNode[] = useMemo(() => {
    return data.nodes.map((node) => ({
      ...node,
      averageCitation: calculateAverageCitations(node, data.nodes, data.links),
    }));
  }, [data.nodes, data.links]);

  useEffect(() => {
    if (!svgRef.current || enrichedNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const g = svg.append('g');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3
      .forceSimulation<EnrichedNode>(enrichedNodes)
      .force('link', d3.forceLink<EnrichedNode, EnrichedLink>(data.links.map(link => ({
        ...link,
        source: typeof link.source === 'string' ? link.source : (link.source as Node).id,
        target: typeof link.target === 'string' ? link.target : (link.target as Node).id
      }))).id((d) => d.id))
      .force('charge', d3.forceManyBody<EnrichedNode>().strength(-300))
      .force('center', d3.forceCenter<EnrichedNode>(width / 2, height / 2))
      .force('collision', d3.forceCollide<EnrichedNode>().radius((d) => getNodeSize(d.averageCitation) + 2));

    const link = g
      .append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1);

    const node = g
      .append('g')
      .selectAll<SVGCircleElement, EnrichedNode>('circle')
      .data(enrichedNodes)
      .join('circle')
      .attr('r', (d) => getNodeSize(d.averageCitation))
      .attr('fill', (d) => NODE_COLORS[d.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .call(
        d3
          .drag<SVGCircleElement, EnrichedNode>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    const tooltip = g
      .append('g')
      .style('opacity', 0)
      .attr('pointer-events', 'none');

    const tooltipBackground = tooltip
      .append('rect')
      .attr('fill', 'white')
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .attr('ry', 4);

    const tooltipText = tooltip
      .append('text')
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, Helvetica, Arial, sans-serif')
      .attr('fill', '#000')
      .attr('text-anchor', 'middle');

    let hoveredNode: EnrichedNode | null = null;

    node.on('mouseenter', function (event, d) {
      hoveredNode = d;
      tooltipText.text(d.label);
      const textWidth = (tooltipText.node() as SVGTextElement)?.getComputedTextLength() || 0;
      tooltipBackground
        .attr('width', textWidth + 16)
        .attr('height', 24)
        .attr('x', -textWidth / 2 - 8)
        .attr('y', -getNodeSize(d.averageCitation) - 34);
      tooltipText
        .attr('x', 0)
        .attr('y', -getNodeSize(d.averageCitation) - 20);
      tooltip.style('opacity', 1);
    }).on('mouseleave', function () {
      hoveredNode = null;
      tooltip.style('opacity', 0);
    });

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as EnrichedNode).x!)
        .attr('y1', (d) => (d.source as EnrichedNode).y!)
        .attr('x2', (d) => (d.target as EnrichedNode).x!)
        .attr('y2', (d) => (d.target as EnrichedNode).y!);

      node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);

      if (hoveredNode) {
        tooltip.attr('transform', `translate(${hoveredNode.x || 0}, ${hoveredNode.y || 0})`);
      }
    });

    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div className="w-full h-full bg-white border border-black">
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

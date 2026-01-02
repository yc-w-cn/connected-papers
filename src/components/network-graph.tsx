'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Node, Link, NodeType } from '@/types/data';

interface NetworkGraphProps {
  data: {
    nodes: Node[];
    links: Link[];
  };
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

export function NetworkGraph({ data }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;

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
      .forceSimulation<Node>(data.nodes)
      .force('link', d3.forceLink<Node, Link>(data.links).id((d) => d.id))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => getNodeSize(d.citationCount) + 2));

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
      .selectAll<SVGCircleElement, Node>('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', (d) => getNodeSize(d.citationCount))
      .attr('fill', (d) => NODE_COLORS[d.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .call(
        d3
          .drag<SVGCircleElement, Node>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    const labels = g
      .append('g')
      .selectAll<SVGTextElement, Node>('text')
      .data(data.nodes.filter((d) => d.type === 'author' || d.citationCount && d.citationCount > 10))
      .join('text')
      .text((d) => d.label)
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, Helvetica, Arial, sans-serif')
      .attr('fill', '#000')
      .attr('text-anchor', 'middle')
      .attr('dy', -15)
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as Node).x!)
        .attr('y1', (d) => (d.source as Node).y!)
        .attr('x2', (d) => (d.target as Node).x!)
        .attr('y2', (d) => (d.target as Node).y!);

      node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);

      labels.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
    });

    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, unknown>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, unknown>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, unknown>) {
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

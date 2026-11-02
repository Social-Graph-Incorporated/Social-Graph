import * as d3 from 'd3';
import { GraphData, GraphLink, GraphNode } from './import';

const fallbackWidth = 1000;
const fallbackHeight = 1000;

const typeColor: Record<string, string> = {
    P: '#2f5d9f', // Prof
    T: '#3d6b4f', // TA
    M: '#8a5a2b', // Peer Mentors
    S: '#6b3d6b', // Students
    C: '#7ee7fc', // CPC Execs
};

export type GraphSimulation = d3.Simulation<GraphNode, GraphLink>;

// Builds a force-directed graph from imported node/link data and draws it
// into the given element (or #graph, which main.tsx mounts on the page).
export function createGraph(
    data: GraphData,
    container: HTMLElement | string = '#graph',
): GraphSimulation {
    const element = resolveContainer(container);
    const width = element.clientWidth || fallbackWidth;
    const height = element.clientHeight || fallbackHeight;
    const root = d3.select(element);

    root.selectAll('*').remove();

    const svg = root
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('cursor', 'grab');

    // Stays put so empty space is always hittable for pan, even after zoom.
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'transparent')
        .attr('pointer-events', 'all');

    const zoomLayer = svg.append('g');

    const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.25, 8])
        .on('start', (event) => {
            if (event.sourceEvent instanceof MouseEvent && event.sourceEvent.type === 'mousedown') {
                svg.style('cursor', 'grabbing');
            }
        })
        .on('end', () => {
            svg.style('cursor', 'grab');
        })
        .on('zoom', (event) => {
            zoomLayer.attr('transform', event.transform.toString());
        });

    svg.call(zoom);

    const controls = root.append('div').attr('class', 'zoom-controls');

    controls
        .append('button')
        .attr('type', 'button')
        .attr('aria-label', 'Zoom in')
        .text('+')
        .on('click', () => {
            svg.transition().duration(200).call(zoom.scaleBy, 1.4);
        });

    controls
        .append('button')
        .attr('type', 'button')
        .attr('aria-label', 'Zoom out')
        .text('−')
        .on('click', () => {
            svg.transition().duration(200).call(zoom.scaleBy, 1 / 1.4);
        });

    controls
        .append('button')
        .attr('type', 'button')
        .attr('aria-label', 'Reset zoom')
        .text('Reset')
        .on('click', () => {
            svg.transition().duration(250).call(zoom.transform, d3.zoomIdentity);
        });

    const simulation = d3
        .forceSimulation(data.nodes)
        .force(
            'link',
            d3.forceLink<GraphNode, GraphLink>(data.links)
                .id((node) => node.id)
                .distance(120),
        )
        .force('charge', d3.forceManyBody().strength(-220))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide(28));

    const link = zoomLayer
        .append('g')
        .attr('stroke', '#b4534a')
        .attr('stroke-width', 2)
        .selectAll<SVGLineElement, GraphLink>('line')
        .data(data.links)
        .join('line');

    const node = zoomLayer
        .append('g')
        .selectAll<SVGGElement, GraphNode>('g')
        .data(data.nodes)
        .join('g')
        .attr('cursor', 'grab');

    node.append('circle')
        .attr('r', 18)
        .attr('fill', (d: GraphNode) => typeColor[d.type ?? ''] ?? '#2f5d9f');

    node.append('text')
        .text((d: GraphNode) => d.id)
        .attr('text-anchor', 'middle')
        .attr('y', 32)
        .attr('fill', '#1c1917')
        .attr('font-size', 12)
        .attr('font-family', 'ui-sans-serif, system-ui, sans-serif');

    node.call(
        d3.drag<SVGGElement, GraphNode>()
            .on('start', (event, d) => {
                event.sourceEvent.stopPropagation();
                if (!event.active) {
                    simulation.alphaTarget(0.3).restart();
                }
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) {
                    simulation.alphaTarget(0);
                }
                d.fx = null;
                d.fy = null;
            }),
    );

    simulation.on('tick', () => {
        link
            .attr('x1', (d: GraphLink) => coord(d.source, 'x'))
            .attr('y1', (d: GraphLink) => coord(d.source, 'y'))
            .attr('x2', (d: GraphLink) => coord(d.target, 'x'))
            .attr('y2', (d: GraphLink) => coord(d.target, 'y'));

        node.attr('transform', (d: GraphNode) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return simulation;
}

export function clearGraph(container: HTMLElement | string = '#graph'): void {
    d3.select(resolveContainer(container)).selectAll('*').remove();
}

function resolveContainer(container: HTMLElement | string): HTMLElement {
    if (typeof container !== 'string') {
        return container;
    }

    const element = document.querySelector(container);
    if (!(element instanceof HTMLElement)) {
        throw new Error(`No graph container found for ${container}`);
    }

    return element;
}

function coord(endpoint: GraphLink['source'], axis: 'x' | 'y'): number {
    return typeof endpoint === 'object' ? endpoint[axis] ?? 0 : 0;
}

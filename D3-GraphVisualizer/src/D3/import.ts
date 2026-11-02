import { SimulationLinkDatum, SimulationNodeDatum } from 'd3';

// One person/place/thing in the social graph.
export interface GraphNode extends SimulationNodeDatum {
    id: string;
    type?: string;
    neighbors?: string[];
    added?: string[];
    removed?: string[];
}

export type GraphLink = SimulationLinkDatum<GraphNode>;

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

// CSV columns, in order:
// Label (ID), Type (P/T/M/S), Neighbors ("1,2,3"), Added Nodes, Removed Nodes.
export function importCSV(file: File): Promise<GraphData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            try {
                resolve(parseGraphCSV(String(reader.result ?? '')));
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(reader.error ?? new Error('Could not read that CSV file.'));
        };

        reader.readAsText(file);
    });
}

export function parseGraphCSV(text: string): GraphData {
    const rows = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map(splitCsvLine);

    if (rows.length === 0) {
        return { nodes: [], links: [] };
    }

    // Skip a header row when the first cell looks like a column name.
    const header = rows[0]?.[0]?.toLowerCase() ?? '';
    const dataRows = header === 'id' || header === 'label' ? rows.slice(1) : rows;

    const nodesById = new Map<string, GraphNode>();

    const remember = (id: string, extra: Partial<GraphNode> = {}) => {
        const existing = nodesById.get(id) ?? { id };
        nodesById.set(id, { ...existing, ...extra, id });
        return nodesById.get(id)!;
    };

    const links: GraphLink[] = [];
    const seenLinks = new Set<string>();

    const addLink = (source: string, target: string) => {
        if (!source || !target || source === target) {
            return;
        }

        remember(source);
        remember(target);

        const key = [source, target].sort().join('|');
        if (seenLinks.has(key)) {
            return;
        }

        seenLinks.add(key);
        links.push({ source, target });
    };

    for (const row of dataRows) {
        const id = row[0];
        if (!id) {
            continue;
        }

        const type = row[1] || undefined;
        const neighbors = parseIdList(row[2] ?? '');
        const added = parseIdList(row[3] ?? '');
        const removed = parseIdList(row[4] ?? '');

        remember(id, { type, neighbors, added, removed });

        for (const neighbor of neighbors) {
            addLink(id, neighbor);
        }
    }

    return {
        nodes: Array.from(nodesById.values()),
        links,
    };
}

function splitCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const character of line) {
        if (character === '"') {
            inQuotes = !inQuotes;
            continue;
        }

        if (character === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
            continue;
        }

        current += character;
    }

    fields.push(current.trim());
    return fields;
}

function parseIdList(value: string): string[] {
    const inner = value.replace(/^\[|\]$/g, '').trim();
    if (!inner) {
        return [];
    }

    return inner
        .split(/[,\s]+/)
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
}

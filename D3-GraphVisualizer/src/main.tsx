import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Helpers this file orchestrates. Each module does one job:
import { createGraph, clearGraph, GraphSimulation } from './D3/graph';
import { GraphData, importCSV } from './D3/import';
import { ClearButton, ImportButton } from './components/button';
import { applyEdits } from './edit';

// Starter graph so the page is not empty before a CSV is chosen.
const sampleGraph: GraphData = {
    nodes: [
        { id: 'alice', type: 'P' },
        { id: 'bob', type: 'T' },
        { id: 'carol', type: 'M' },
        { id: 'dave', type: 'S' },
    ],
    links: [
        { source: 'alice', target: 'bob' },
        { source: 'bob', target: 'carol' },
        { source: 'carol', target: 'alice' },
        { source: 'bob', target: 'dave' },
    ],
};

function App() {
    // D3 draws into this div. React owns the page around it.
    const graphElement = useRef<HTMLDivElement>(null);
    const simulation = useRef<GraphSimulation | null>(null);
    const [status, setStatus] = useState('Showing the sample social graph.');

    function draw(data: GraphData) {
        const host = graphElement.current;
        if (!host) {
            return;
        }

        // Stop any previous simulation, then run optional edits, then draw.
        simulation.current?.stop();
        const graph = applyEdits(data);
        simulation.current = createGraph(graph, host);
        setStatus(`${graph.nodes.length} nodes · ${graph.links.length} edges`);
    }

    // Import button → file picker → CSV parser → graph.
    function handleImport(file: File) {
        importCSV(file)
            .then((data) => {
                draw(data);
                setStatus(`Loaded ${file.name}: ${data.nodes.length} nodes · ${data.links.length} links`);
            })
            .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : 'Could not import that CSV.';
                setStatus(message);
            });
    }

    // Clear button → stop the simulation and empty the SVG.
    function handleClear() {
        simulation.current?.stop();
        simulation.current = null;
        if (graphElement.current) {
            clearGraph(graphElement.current);
        }
        setStatus('Graph cleared. Import a CSV to draw again.');
    }

    useEffect(() => {
        draw(sampleGraph);

        return () => {
            simulation.current?.stop();
        };
    }, []);

    return (
        <>
            <header className="site-header">
                <p className="eyebrow">Social Graph</p>
                <h1>Graph Visualizer</h1>
                <p className="lede">
                    Import a CSV of people and connections, then explore the
                    force-directed layout. Scroll to zoom, drag the canvas to
                    pan, or use the controls on the graph.
                </p>
            </header>

            <main>
                {/* Buttons talk to main.tsx; they do not draw the graph themselves. */}
                <div className="toolbar">
                    <ImportButton onFile={handleImport} />
                    <ClearButton onClear={handleClear} />
                    <p className="status">{status}</p>
                </div>

                {/* D3 mounts its SVG inside #graph. */}
                <section className="stage" aria-label="Graph">
                    <div id="graph" ref={graphElement}></div>
                </section>
            </main>
        </>
    );
}

const root = document.getElementById('root');
if (root) {
    createRoot(root).render(<App />);
}

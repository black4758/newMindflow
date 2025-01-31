import { ReactFlow } from '@xyflow/react';

function App() {
    const nodes = [
        { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
        { id: '2', position: { x: 100, y: 100 }, data: { label: 'Node 2' } },
    ];

    const edges = [{ id: 'e1-2', source: '1', target: '2' }];

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow nodes={nodes} edges={edges} />
        </div>
    );
}

export default App;

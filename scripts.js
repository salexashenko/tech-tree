
// Fetch the tech tree data from techTree.json
fetch('techTree.json')
    .then(response => response.json())
    .then(data => {
        const techData = data;

        // Dynamically determine root nodes
        const rootNodes = techData.filter(item => item.dependencies.length === 0).map(item => '#' + item.id).join(', ');

        // Initialize Cytoscape
        const cy = cytoscape({
            container: document.getElementById('cy'),
            elements: createElements(techData),
            style: [{
                selector: 'node',
                style: {
                    'label': 'data(label)'
                }
            }, {
                selector: 'edge',
                style: {
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle'
                }
            }],
            layout: {
                name: 'breadthfirst',
                directed: true,
                spacingFactor: 0.75,
                roots: rootNodes
            }
        });
    });

function createElements(data) {
    let elements = [];

    data.forEach(item => {
        elements.push({
            data: { id: item.id, label: item.label }
        });

        item.dependencies.forEach(dep => {
            elements.push({
                data: { id: item.id + dep, source: item.id, target: dep }
            });
        });
    });

    return elements;
}

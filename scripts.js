// Fetch the tech tree data from techTree.json
fetch('techTree.json')
    .then(response => response.json())
    .then(data => {
        const techData = data;
        const rootNodes = techData.filter(item => item.dependencies.length === 0).map(item => '#' + item.id).join(', ');

        // Initialize Cytoscape
        const cy = cytoscape({
            container: document.getElementById('cy'),
            elements: createElements(techData),
            style: [{
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'background-color': '#636363',
                    'color': '#ffffff',
                    'text-outline-color': '#636363',
                    'text-outline-width': '2px'
                }
            }, {
                selector: 'edge',
                style: {
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle',
                    'line-color': '#888888',
                    'target-arrow-color': '#888888'
                }
            }, {
                selector: '.highlighted',
                style: {
                    'background-color': '#FFD700',
                    'line-color': '#FFD700',
                    'target-arrow-color': '#FFD700',
                    'color': '#000000',
                    'text-outline-color': '#FFD700'
                }
            }],

            layout: {
                name: 'dagre',
                rankDir: 'BT',  // Bottom-to-top direction
                nodeDimensionsIncludeLabels: true,  // Ensures the labels are considered for layout spacing
                spacingFactor: 1.5  // Adjust as needed for desired spacing
            }

        });

        cy.on('tap', 'node', function (evt) {
            let node = evt.target;
            cy.elements().removeClass('highlighted');
            node.connectedEdges().addClass('highlighted');
            node.addClass('highlighted');
        });

    });

function createElements(data) {
    const a = 3.0;
    const b = 1760001;
    let elements = [];

    data.forEach(item => {
        let y = a * Math.log10(item.year + b);
        elements.push({
            data: { id: item.id, label: item.label },
            position: { y: y }
        });

        item.dependencies.forEach(dep => {
            elements.push({
                data: { id: item.id + dep, source: dep, target: item.id } // Reversed source and target
            });
        });
    });

    return elements;
}


// Fetch the tech tree data from techTree.json
fetch('techTree.json')
    .then(response => response.json())
    .then(data => {
        const techData = data;
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
                name: 'breadthfirst',
                directed: true,
                spacingFactor: 1.5, // Increased spacing
                roots: rootNodes
            }
        });

        cy.on('tap', 'node', function (evt) {
            let node = evt.target;
            cy.elements().removeClass('highlighted');
            node.connectedEdges().addClass('highlighted');
            node.addClass('highlighted');
        });


        cy.on('tap', 'node', function (evt) {
            let node = evt.target;
            cy.elements().removeClass('highlighted');
            node.connectedEdges().addClass('highlighted');
            node.addClass('highlighted');
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
                data: { id: item.id + dep, source: dep, target: item.id } // Reversed source and target
            });
        });
    });

    return elements;
}
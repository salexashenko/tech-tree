document.addEventListener("DOMContentLoaded", function () {
    fetch('techTree.json')
        .then(response => response.json())
        .then(data => {
            const cy = cytoscape({
                container: document.getElementById('cy'),
                elements: createElements(data),
                style: [
                    {
                        selector: 'node',
                        style: {
                            'label': 'data(label)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'background-color': '#888',
                            'color': '#000',
                            'width': 'label',
                            'height': 'label',
                            'padding': '10px'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'curve-style': 'bezier',
                            'target-arrow-shape': 'triangle',
                            'line-color': '#888',
                            'target-arrow-color': '#888'
                        }
                    }
                ],
                layout: {
                    name: 'dagre'
                }
            });

            cy.on('tap', 'node', function (evt) {
                let node = evt.target;
                cy.elements().style({ 'background-color': '#888', 'line-color': '#888', 'color': '#000' });
                node.connectedEdges().style('line-color', '#f00');
                node.style('background-color', '#f00');
            });
        });
});

function createElements(data) {
    const a = 30.0;  // scaling factor for better spacing
    const b = 1760001;
    let nodes = [];
    let edges = [];
    for (let item of data) {
        let y = a * Math.log10(item.year + b);
        nodes.push({ data: { id: item.id, label: item.label }, position: { x: 0, y: -y } });  // inverted y for correct chronological order
        for (let dep of item.dependencies) {
            edges.push({ data: { source: dep, target: item.id } });
        }
    }
    return nodes.concat(edges);
}

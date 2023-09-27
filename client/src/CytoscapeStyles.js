export const cytoscapeStyles = [{
    selector: 'node',
    style: {
        'shape': 'round-rectangle',
        'label': 'data(label)',
        'background-color': '#ffffff',
        'border-color': '#002fa7',
        'border-width': '2px',
        'color': '#002fa7',
        // 'text-outline-color': '#002fa7',
        // 'text-outline-width': '2px',
        'font-size': '30px',
        'font-weight': 'bold',
        'text-halign': 'center',
        'text-valign': 'center',
        'width': '400 px',
        'height': '100 px',

    }
}, {
    selector: 'edge',
    style: {
        'curve-style': 'unbundled-bezier',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#888888',
        'line-color': '#888888'
    }
}, {
    selector: '.highlighted',
    style: {
        'background-color': '#FFD700',
        'line-color': '#FFD700',
        'target-arrow-color': '#FFD700',
        'color': '#000000',
        'text-outline-color': '#FFD700'
    },
},
{
    selector: '.eh-handle',
    style: {
        'background-color': 'green',
        'width': 12,
        'height': 12,
        'shape': 'ellipse',
        'overlay-opacity': 0,
        'border-width': 12, // makes the handle easier to hit
        'border-opacity': 0
    }
},

{
    selector: '.eh-hover',
    style: {
        'background-color': 'green'
    }
},

{
    selector: '.eh-source',
    style: {
        'border-width': 2,
        'border-color': 'green'
    }
},

{
    selector: '.eh-target',
    style: {
        'border-width': 2,
        'border-color': 'green'
    }
},

{
    selector: '.eh-preview, .eh-ghost-edge',
    style: {
        'background-color': 'green',
        'line-color': 'green',
        'target-arrow-color': 'green',
        'source-arrow-color': 'green'
    }
},

{
    selector: '.eh-ghost-edge.eh-preview-active',
    style: {
        'opacity': 0
    }
}];
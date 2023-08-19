
document.addEventListener("DOMContentLoaded", function() {
    const techData = [{"id": "handaxe", "label": "Handaxe", "dependencies": []}, {"id": "fire", "label": "Control of Fire", "dependencies": []}, {"id": "flintknapping", "label": "Flint Knapping", "dependencies": ["handaxe"]}, {"id": "spear", "label": "Spears", "dependencies": ["flintknapping"]}, {"id": "bowandarrow", "label": "Bow and Arrow", "dependencies": ["flintknapping"]}, {"id": "fishing", "label": "Fishing Techniques", "dependencies": ["spear"]}, {"id": "clothing", "label": "Basic Clothing", "dependencies": ["weaving"]}, {"id": "pottery", "label": "Pottery", "dependencies": ["fire"]}, {"id": "domestication", "label": "Animal Domestication", "dependencies": []}, {"id": "agriculture", "label": "Agriculture", "dependencies": ["domestication"]}, {"id": "grindingstone", "label": "Grinding Stone", "dependencies": ["agriculture", "flintknapping"]}, {"id": "weaving", "label": "Weaving", "dependencies": ["agriculture"]}, {"id": "basketry", "label": "Basketry", "dependencies": ["weaving"]}, {"id": "fishhook", "label": "Fishhook", "dependencies": ["fishing", "flintknapping"]}, {"id": "shelter", "label": "Basic Shelters", "dependencies": ["handaxe", "fire"]}, {"id": "rockart", "label": "Rock Art", "dependencies": ["handaxe"]}, {"id": "burialpractices", "label": "Burial Practices", "dependencies": ["shelter"]}, {"id": "hardenedspear", "label": "Fire-Hardened Spear", "dependencies": ["spear", "fire"]}];
    
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
            name: 'cola',
            flow: { axis: 'y', minSeparation: 30 }
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

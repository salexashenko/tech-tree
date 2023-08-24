import axios from 'axios';
import cytoscape from 'cytoscape';
import contextMenus from 'cytoscape-context-menus';
import dagre from 'cytoscape-dagre';
import edgehandles from 'cytoscape-edgehandles';
import React, { useContext, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import CytoscapeComponent from 'react-cytoscapejs';
import { Overlay } from 'react-overlays';
import { TokenContext } from './Home';
import './TechTree.css';




// import CSS as well
import 'cytoscape-context-menus/cytoscape-context-menus.css';
cytoscape.use(dagre);
cytoscape.use(edgehandles);
cytoscape.use(contextMenus);


const TechTree = () => {
    const cyRef = React.useRef();
    const [elements, setElements] = useState([]);
    const [firstNode, setFirstNode] = useState(null);
    const token = useContext(TokenContext); // Assuming you're using Context API to store the token
    const [creatingEdge, setCreatingEdge] = useState(false);
    const [cursor, setCursor] = useState('pointer');

    const [show, setShow] = useState(false);
    const [target, setTarget] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        year: '',
        parentTech: 'None',
        childTech: 'None'
    });
    const [parentTechFilter, setParentTechFilter] = useState('');
    const [childTechFilter, setChildTechFilter] = useState('');

    const handleClick = (event) => {
        setShow(!show);
        setTarget(event.target);
    };
    const handleDone = () => {
        setShow(false);
        // API call to create a new node
        if (formData.name === '') {
            alert('Please enter a name');
            return;
        }
        if (!Number.isInteger(Number(formData.year))) {
            alert('Please enter a proper year');
            return;
        }
        if (formData.parentTech === formData.childTech && formData.parentTech === 'None') {
            alert('Please select a parent or child tech');
            return;
        }
        if (formData.parentTech === formData.childTech) {
            alert('Please select different parent and child techs');
            return;
        }
        addNode(formData.name, formData.year).then((newNodeId) => {
            // If the user selected a parent tech, create an edge between the new node and the parent tech. Remember
            console.log(formData.parentTech);
            console.log(formData.childTech);
            console.log(label2id(formData.parentTech));
            console.log(label2id(formData.childTech));
            (formData.parentTech !== 'None') && addEdge(label2id(formData.parentTech), newNodeId);
            // If the user selected a child tech, create an edge between the new node and the child tech
            (formData.childTech !== 'None') && addEdge(newNodeId, label2id(formData.childTech));
        });
    };





    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const addEdge = async (source, target) => {
        try {
            const response = await axios.post('/api/edges', {
                source_node_id: Number(source),
                target_node_id: Number(target)
            });

            // Assuming the response contains the newly created edge
            const newEdge = response.data;
            const newEdgeElement = {
                data: {
                    id: `edge${newEdge.id}`,
                    source: newEdge.source_node_id,
                    target: newEdge.target_node_id
                }
            };

            // Update the elements state with the new edge
            setElements(prevElements => [...prevElements, newEdgeElement]);

        } catch (error) {
            console.error('Error creating edge:', error);
        }
    };


    const addNode = async (label, year) => {
        try {
            // Send POST request to create a new node
            const response = await axios.post('/api/nodes', {
                label: label,
                year: year
            });

            // Assuming the response contains the newly created node
            const newNode = response.data;

            // Create a new node element
            const newNodeElement = {
                data: {
                    id: newNode.id,
                    label: newNode.label
                },
            };

            // Update the elements state with the new node
            setElements(prevElements => [...prevElements, newNodeElement]);
            return newNode.id;
        } catch (error) {
            console.error('Error creating node:', error);
        }
    };
    useEffect(() => {
        if (token) {
            console.log(token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    useEffect(() => {
        const cy = cyRef.current;
        const fetchData = async () => {
            try {
                const nodeResponse = await axios.get('/api/nodes');
                console.log('ding');
                const edgeResponse = await axios.get('/api/edges');
                console.log('dong');

                const nodeData = nodeResponse.data.map(node => ({
                    data: { id: node.id, label: node.label, year: node.year },
                }));

                const edgeData = edgeResponse.data.map(edge => ({
                    data: { id: `edge${edge.id}`, target: edge.target_node_id, source: edge.source_node_id }
                }));
                setElements([...nodeData, ...edgeData,]);
            } catch (error) {
                console.log('The witch is dead', error);
            }
        };

        fetchData();
    }, []);

    // console.log(elements);
    // only show techs where a label exists
    let filteredElements = elements.filter((e) => e.data.label);
    let filteredParentTechs = filteredElements.filter((e) => e.data.label.toLowerCase().includes(parentTechFilter.toLowerCase()));
    let filteredChildTechs = filteredElements.filter((e) => e.data.label.toLowerCase().includes(childTechFilter.toLowerCase()));
    console.log(filteredParentTechs);
    const label2id = (label) => {
        let id = null;
        elements.forEach((element) => {
            // this will throw an error if the label is null so make sure to skip elements with null labels
            if (element.data.label && element.data.label.toLowerCase() === label.toLowerCase()) {
                id = element.data.id;
            }
        });
        return id;
    };
    useEffect(() => {
        const cy = cyRef.current;
        if (cy && elements.length > 0) {
            const layout = cy.layout({
                name: 'dagre',
                animate: false,
                nodeSep: 1,
                avoidOverlap: true,
                nodeDimensionsIncludeLabels: true,
                rankDir: 'TB',
                spacingFactor: 3,
                fit: false,
                padding: 30,
                infinite: true

            });
            layout.run();
            cy.layout({
                name: 'dagre'
            }).run();

            function verticalPos(x) {
                // Return ~6000 for x <= -2000000
                if (x <= -2000000) {
                    return 6000;
                }

                // Between -2000000 and -100000
                else if (-2000000 < x && x <= -100000) {
                    return 6000 - 100 * ((x + 2000000) / 1000000);
                }

                // Between -100000 and -10000
                else if (-100000 < x && x <= -10000) {
                    return 5800 - 100 * ((x + 100000) / 10000);
                }

                // Between -10000 and -1000
                else if (-10000 < x && x <= -1000) {
                    return 5700 - 100 * ((x + 10000) / 1000);
                }

                // Between -1000 and 1500
                else if (-1000 < x && x <= 1500) {
                    return 5500 - 100 * ((x + 1000) / 100);
                }

                // Between 1500 and 1900
                else if (1500 < x && x <= 1900) {
                    return 5000 - 100 * ((x - 1500) / 50);
                }

                // Above 1900
                else {
                    return 4800 - 100 * ((x - 1900) / 10);
                }
            }


            cy.nodes().forEach(node => {
                let year = node.data('year');
                let yPos = verticalPos(year);
                node.position({
                    y: yPos
                });
            });

            const NODE_WIDTH = 200;
            const NODE_HEIGHT = 50;
            const X_MARGIN = 50;
            const Y_MARGIN = 50;

            const MIN_X_DISTANCE = NODE_WIDTH + X_MARGIN;
            const MIN_Y_DISTANCE = NODE_HEIGHT + Y_MARGIN;

            // Sort nodes by y-position
            let sortedNodes = cy.nodes().sort((a, b) => {
                return a.position('y') - b.position('y');
            });

            let isOverlapping = (nodeA, nodeB) => {
                let posA = nodeA.position();
                let posB = nodeB.position();

                let xOverlap = Math.abs(posA.x - posB.x) < MIN_X_DISTANCE;
                let yOverlap = Math.abs(posA.y - posB.y) < MIN_Y_DISTANCE;

                return xOverlap && yOverlap;
            };

            let adjustPositions = true;

            while (adjustPositions) {
                adjustPositions = false;

                for (let i = 0; i < sortedNodes.length; i++) {
                    for (let j = i + 1; j < sortedNodes.length; j++) {
                        let nodeA = sortedNodes[i];
                        let nodeB = sortedNodes[j];

                        while (isOverlapping(nodeA, nodeB)) {
                            // Move nodeB to the right
                            nodeB.position({
                                x: nodeB.position('x') + MIN_X_DISTANCE
                            });
                            adjustPositions = true;
                        }
                    }
                }
            }
            function applyConditionalStyling(cy) {
                cy.style().selector('node').style({
                    'border-color': function (node) {
                        let year = node.data('year');

                        if (year < -2000) {
                            return '#808080';
                        } else if (year >= -2000 && year < -700) {
                            return '#cd7f32';
                        } else if (year >= -700 && year <= 1500) {
                            return '#434b4d';
                        } else {
                            return '#002fa7';
                        }
                    }
                }).update(); // Apply the styling updates
            }


            // Call the function to apply the styling
            applyConditionalStyling(cy);

            // set camera position to show all nodes
            cy.fit();

            // let years = [-2000000, -1000000, -100000, -10000, -1000, -500, 1, 500, 1000, 1500, 1600, 1700, 1800, 1900, 2000];

            // let yPositions = years.map(verticalPos);

            // let yLabels = years.map(year => {
            //     if (year < 0) {
            //         return `${Math.abs(year).toLocaleString()} BCE`;
            //     } else if (year === 1) {
            //         return `1 CE`;
            //     } else {
            //         return `${year} CE`;
            //     }
            // });

            // for (let i = 0; i < yPositions.length; i++) {
            //     if (!cy.getElementById('label-' + i).empty()) {
            //         // Node with this ID already exists, skip adding it
            //         continue;
            //     }
            //     cy.add({
            //         group: 'nodes',
            //         data: { id: 'label-' + i, label: yLabels[i] },
            //         position: { x: 50, y: yPositions[i] }  // assuming X=0 for all Y-axis labels
            //     });
            // }

            // // 2. Style the Dummy Nodes
            // cy.style()
            //     .selector('node[id ^= "label-"]') // selects nodes with ids that start with "label-"
            //     .style({
            //         'background-opacity': 0, // make the node transparent
            //         'border-opacity': 0,
            //         'width': 1,
            //         'height': 1,
            //         'text-valign': 'center',
            //         'text-halign': 'right'
            //     })
            //     .update();

            // // 3. Lock the Dummy Nodes
            // cy.nodes('[id ^= "label-"]').lock();



            // // Optional: If you want to make sure edges are redrawn correctly
            // cy.edges().forEach(edge => {
            //     edge.rerender();
            // });
        }
    }, [elements]);



    const style = [{
        selector: 'node',
        style: {
            'shape': 'round-rectangle',
            'label': 'data(label)',
            'background-color': '#ffffff',
            'border-color': '#002fa7',
            'border-width': '2px',
            'color': '#ffffff',
            'text-outline-color': '#002fa7',
            'text-outline-width': '2px',
            'text-wrap': '',
            'text-halign': 'center',
            'text-valign': 'center',
            'width': '200 px',

        }
    }, {
        selector: 'edge',
        style: {
            'curve-style': 'bezier',
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

    return (
        <div>
            <p></p>
            <div>
                <Button onClick={handleClick} style={{ backgroundColor: '#ffffff', borderColor: '#002fa7', borderRadius: '4px' }}>
                    Add Technology
                </Button>

                <Overlay show={show} target={target} placement="bottom">
                    {({ props, arrowProps }) => (
                        <div {...props} className="custom-overlay">
                            <div {...arrowProps} className="custom-arrow" />
                            <Form>
                                <Form.Group controlId="name">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} />
                                </Form.Group>
                                <Form.Group controlId="year">
                                    <Form.Label>Year</Form.Label>
                                    <Form.Control type="text" name="year" value={formData.year} onChange={handleChange} />
                                </Form.Group>

                                <Form.Group controlId="parentTech">
                                    <Form.Label>Parent Tech    </Form.Label>
                                    {/* <Form.Control type="text" placeholder="Start typing to filter..." onChange={(e) => setParentTechFilter(e.target.value)} /> */}
                                    <Form.Control as="select" name="parentTech" value={formData.parentTech} onChange={handleChange}>
                                        <option value="None">None</option>
                                        {filteredParentTechs.map((tech, index) => (
                                            <option key={index} value={tech.data.label}>{tech.data.label}</option>
                                        ))}
                                    </Form.Control>

                                </Form.Group>

                                <Form.Group controlId="childTech">
                                    <Form.Label>Child Tech    </Form.Label>
                                    {/* <Form.Control type="text" placeholder="Start typing to filter..." onChange={(e) => setChildTechFilter(e.target.value)} /> */}
                                    <Form.Control as="select" name="childTech" value={formData.childTech} onChange={handleChange}>
                                        <option value="None">None</option>
                                        {filteredChildTechs.map((tech, index) => (
                                            <option key={index} value={tech.data.label}>{tech.data.label}</option>
                                        ))}
                                    </Form.Control>

                                </Form.Group>

                                <Button onClick={handleDone} style={{ backgroundColor: '#ffffff', borderColor: '#002fa7', borderRadius: '4px' }}>
                                    Done
                                </Button>
                            </Form>
                        </div>
                    )}
                </Overlay>
            </div >
            <CytoscapeComponent
                container={cyRef.current}
                elements={elements}
                // layout={layout}
                style={{ width: '1000px', height: '1000px', cursor: cursor, border: '1px solid #002fa7' }}
                stylesheet={style}
                cy={(cy) => {
                    cyRef.current = cy;
                    cy.on('tap', 'node', function (evt) {
                        if (creatingEdge === 'parent') {
                            addEdge(firstNode, evt.target.id());
                            setFirstNode(null);
                            setCursor('pointer');
                        } else if (creatingEdge === 'child') {
                            addEdge(evt.target.id(), firstNode);
                            setFirstNode(null);
                            setCursor('pointer');
                        } else {
                            cy.elements().removeClass('highlighted');
                            evt.target.connectedEdges().addClass('highlighted');
                            evt.target.addClass('highlighted');
                        }
                    });
                    var eh = cy.edgehandles(
                        {
                            canConnect: function (sourceNode, targetNode) {
                                //disallow loops
                                //TODO add more checks here

                                return !sourceNode.same(targetNode); // e.g. disallow loops
                            },
                            disableBrowserGestures: false,
                        }
                    );
                    // eh.enableDrawMode();
                    const options = {
                        // Customize event to bring up the context menu
                        // Possible options https://js.cytoscape.org/#events/user-input-device-events
                        evtType: 'cxttap',
                        // List of initial menu items
                        // A menu item must have either onClickFunction or submenu or both
                        menuItems: [
                            {
                                id: 'draw-eh-link',
                                content: 'Draw Link',
                                tooltipText: 'Draw Link',
                                selector: 'node',
                                onClickFunction: function (event) {
                                    eh.start(event.target || event.cyTarget);
                                }
                            },
                            {
                                id: 'remove',
                                content: 'Remove',
                                tooltipText: 'Remove',
                                selector: 'node, edge',
                                onClickFunction: function (event) {
                                    const target = event.target || event.cyTarget;
                                    console.log('remove ' + target.id());
                                }
                            },
                            // {
                            //     id: 'highlight-successors',
                            //     content: 'Highlight Dependencies',
                            //     tooltipText: 'Highlight Dependencies',
                            //     selector: 'node',
                            //     onClickFunction: function (event) {
                            //         const target = event.target || event.cyTarget;
                            //         target.successors().addClass('highlighted');
                            //     }
                            // },
                            // {
                            //     id: 'highlight-predecessors',
                            //     content: 'Highlight Dependents',
                            //     tooltipText: 'Highlight Dependents',
                            //     selector: 'node',
                            //     onClickFunction: function (event) {
                            //         const target = event.target || event.cyTarget;
                            //         target.predecessors().addClass('highlighted');
                            //     }
                            // },
                            {
                                id: 'select-predecessors',
                                content: 'Select Dependents',
                                tooltipText: 'Select Dependents',
                                selector: 'node',
                                onClickFunction: function (event) {
                                    const target = event.target || event.cyTarget;
                                    target.predecessors().select();
                                }
                            }
                        ],
                        // css classes that menu items will have
                        menuItemClasses: [
                            // add class names to this list
                        ],
                        // css classes that context menu will have
                        contextMenuClasses: [
                            // add class names to this list
                        ],
                        // Indicates that the menu item has a submenu. If not provided default one will be used
                        submenuIndicator: { src: 'assets/submenu-indicator-default.svg', width: 12, height: 12 }
                    };

                    var instance = cy.contextMenus(options);

                    // cy.on('cxttap', 'node', function (evt) {
                    //     cy.elements().removeClass('highlighted');
                    //     evt.target.addClass('highlighted');
                    //     setFirstNode(evt.target.id());
                    //     setFirstNodePosition(evt.target.position());
                    //     setCreating(true);
                    // });
                    cy.on('ehcomplete', (event, sourceNode, targetNode, addedEdge) => {
                        // this event is thrown three times for some reason
                        cy.remove(addedEdge);


                        Number.isInteger(Number(sourceNode.id())) && Number.isInteger(Number(targetNode.id())) && addEdge(sourceNode.id(), targetNode.id());

                    });

                    // on click on background remove all highlights and selctions
                    cy.on('tap', function (event) {
                        if (event.target === cy) {
                            cy.elements().removeClass('highlighted');
                            cy.elements().unselect();
                        }
                    }
                    );


                }}
            />
        </div >
    );
};

export default TechTree;

import axios from 'axios';
import cytoscape from 'cytoscape';
import contextMenus from 'cytoscape-context-menus';
import dagre from 'cytoscape-dagre';
import edgehandles from 'cytoscape-edgehandles';
import React, { useContext, useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { TokenContext } from './Home';



// import CSS as well
import 'cytoscape-context-menus/cytoscape-context-menus.css';
cytoscape.use(dagre);
cytoscape.use(edgehandles);
cytoscape.use(contextMenus);


const TechTree = () => {
    const cyRef = React.useRef();
    const [elements, setElements] = useState([]);
    const [creating, setCreating] = useState(false);
    const [firstNode, setFirstNode] = useState(null);
    const [newNodeInfo, setNewNodeInfo] = useState({ label: '', year: 0 });
    const [firstNodePosition, setFirstNodePosition] = useState(null);
    const [newNodeRelation, setNewNodeRelation] = useState(null); // can be 'source' or 'target'
    const token = useContext(TokenContext); // Assuming you're using Context API to store the token
    const [creatingEdge, setCreatingEdge] = useState(false);
    const [cursor, setCursor] = useState('pointer');

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


    const addNode = async (label, year, position) => {
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
                position: position
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
                const edgeResponse = await axios.get('/api/edges');

                const nodeData = nodeResponse.data.map(node => ({
                    data: { id: node.id, label: node.label },
                    // position: { y: 3.0 * Math.log10(node.year + 1760001) }
                }));

                const edgeData = edgeResponse.data.map(edge => ({
                    data: { id: `edge${edge.id}`, target: edge.target_node_id, source: edge.source_node_id }
                }));


                setElements([...nodeData, ...edgeData,]);
            } catch (error) {
                console.log('Error fetching data', error);
            }
        };

        fetchData();
    }, []);


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
            'source-arrow-shape': 'triangle',
            'source-arrow-color': '#888888',
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
            <h1>Tech Tree</h1>
            {creating && newNodeRelation && (
                <div>
                    <input
                        type="text"
                        placeholder="Label"
                        value={newNodeInfo.label}
                        onChange={(e) => setNewNodeInfo({ ...newNodeInfo, label: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="Year"
                        value={newNodeInfo.year}
                        onChange={(e) => setNewNodeInfo({ ...newNodeInfo, year: parseInt(e.target.value, 10) })}
                    />
                    <button onClick={async () => {
                        const newNode = await addNode(newNodeInfo.label, newNodeInfo.year);
                        if (newNode) { // Ensure the node was actually created
                            await addEdge(
                                (newNodeRelation === 'source') ? firstNode : newNode,
                                (newNodeRelation === 'source') ? newNode : firstNode
                            );
                        }
                        setCreating(false);
                        setFirstNode(null);
                        setNewNodeInfo({ label: '', year: '0' });
                    }}>Add Node</button>
                </div>
            )}
            <CytoscapeComponent
                container={cyRef.current}
                elements={elements}
                // layout={layout}
                style={{ width: '1000px', height: '1000px', cursor: cursor }}
                stylesheet={style}
                cy={(cy) => {
                    cyRef.current = cy;
                    cy.on('tap', 'node', function (evt) {
                        if (creatingEdge === 'parent') {
                            addEdge(firstNode, evt.target.id());
                            setCreatingEdge(false);
                            setFirstNode(null);
                            setCursor('pointer');
                        } else if (creatingEdge === 'child') {
                            addEdge(evt.target.id(), firstNode);
                            setCreatingEdge(false);
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
                                id: 'add-child-node',
                                content: 'Add New Child Tech',
                                tooltipText: 'Add New Child Tech',
                                selector: 'node',
                                onClickFunction: function (event) {
                                    const target = event.target || event.cyTarget;
                                    console.log('add child node to ' + target.id());
                                }
                            },
                            {
                                id: 'add-parent-node',
                                content: 'Add New Parent Tech',
                                tooltipText: 'Add New Parent Tech',
                                selector: 'node',
                                onClickFunction: function (event) {
                                    const target = event.target || event.cyTarget;
                                    console.log('add parent node to ' + target.id());
                                }
                            },
                            {
                                id: 'add-child-edge',
                                content: 'Link to Child Tech',
                                tooltipText: 'Link to Child Tech',
                                selector: 'node',
                                onClickFunction: function (event) {
                                    const target = event.target || event.cyTarget;
                                    setCreatingEdge('child');
                                    setCursor('crosshair');
                                    setFirstNode(target.id());
                                }
                            },
                            {
                                id: 'add-parent-edge',
                                content: 'Link to Parent Tech',
                                tooltipText: 'Link to Parent Tech',
                                selector: 'node',
                                onClickFunction: function (event) {
                                    const target = event.target || event.cyTarget;
                                    setCreatingEdge('parent');
                                    setCursor('crosshair');
                                    setFirstNode(target.id());
                                }
                            },
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
                            setCreating(false);
                            setFirstNode(null);
                            setCursor('pointer');
                        }
                    }
                    );


                }}
            />
        </div>
    );
};

export default TechTree;

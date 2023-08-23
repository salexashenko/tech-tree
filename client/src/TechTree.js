import axios from 'axios';
import cytoscape from 'cytoscape';
import contextMenus from 'cytoscape-context-menus';
import dagre from 'cytoscape-dagre';
import React, { useContext, useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { TokenContext } from './Home';

// import CSS as well
import 'cytoscape-context-menus/cytoscape-context-menus.css';
cytoscape.use(dagre);

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
                    source: newEdge.target_node_id,
                    target: newEdge.source_node_id
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
                const nodeResponse = await axios.get('http://localhost:3001/api/nodes');
                const edgeResponse = await axios.get('http://localhost:3001/api/edges');

                const nodeData = nodeResponse.data.map(node => ({
                    data: { id: node.id, label: node.label },
                    // position: { y: 3.0 * Math.log10(node.year + 1760001) }
                }));

                const edgeData = edgeResponse.data.map(edge => ({
                    data: { id: `edge${edge.id}`, target: edge.source_node_id, source: edge.target_node_id }
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
                animate: true,
                nodeSep: 50,
                avoidOverlap: true,
                nodeDimensionsIncludeLabels: true,
                rankDir: 'BT',
                spacingFactor: 1.3,
                fit: false,
                padding: 30,
                infinite: true

            });
            layout.run();
        }
    }, [elements]);

    const options = {
        // Customize event to bring up the context menu
        // Possible options https://js.cytoscape.org/#events/user-input-device-events
        evtType: 'cxttap',
        // List of initial menu items
        // A menu item must have either onClickFunction or submenu or both
        menuItems: [
            {
                id: 'remove', // ID of menu item
                content: 'remove', // Display content of menu item
                tooltipText: 'remove', // Tooltip text for menu item
                image: { src: "remove.svg", width: 12, height: 12, x: 6, y: 4 }, // menu icon
                // Filters the elements to have this menu item on cxttap
                // If the selector is not truthy no elements will have this menu item on cxttap
                selector: 'node, edge',
                onClickFunction: function () { // The function to be executed on click
                    console.log('remove element');
                },
                disabled: false, // Whether the item will be created as disabled
                show: false, // Whether the item will be shown or not
                hasTrailingDivider: true, // Whether the item will have a trailing divider
                coreAsWell: false // Whether core instance have this item on cxttap
            },
            {
                id: 'hide',
                content: 'hide',
                tooltipText: 'hide',
                selector: 'node, edge',
                onClickFunction: function () {
                    console.log('hide element');
                },
                disabled: true
            },
            {
                id: 'add-node',
                content: 'add node',
                tooltipText: 'add node',
                image: { src: "add.svg", width: 12, height: 12, x: 6, y: 4 },
                selector: 'node',
                coreAsWell: true,
                onClickFunction: function () {
                    console.log('add node');
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


    const style = [{
        selector: 'node',
        style: {
            'label': 'data(label)',
            'background-color': '#636363',
            'color': '#ffffff',
            'text-outline-color': '#636363',
            'text-outline-width': '2px',

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
                style={{ width: '2000px', height: '2000px' }}
                stylesheet={style}
                cy={(cy) => {
                    cyRef.current = cy;
                    cy.on('tap', 'node', function (evt) {
                        if (creating) {
                            addEdge(firstNode, evt.target.id());
                            setCreating(false);
                            setFirstNode(null);
                        } else {
                            cy.elements().removeClass('highlighted');
                            evt.target.connectedEdges().addClass('highlighted');
                            evt.target.addClass('highlighted');
                        }
                    });
                    var instance = cy.contextMenus(options);

                    // cy.on('cxttap', 'node', function (evt) {
                    //     cy.elements().removeClass('highlighted');
                    //     evt.target.addClass('highlighted');
                    //     setFirstNode(evt.target.id());
                    //     setFirstNodePosition(evt.target.position());
                    //     setCreating(true);
                    // });

                    cy.on('tap', function (evt) {
                        if (evt.target === cy && creating) {
                            const yPos = evt.position.y;
                            if (yPos < firstNodePosition.y) {
                                setNewNodeRelation('target');
                            } else {
                                setNewNodeRelation('source');
                            }
                        }
                    });

                }}
            />
        </div>
    );
};

export default TechTree;

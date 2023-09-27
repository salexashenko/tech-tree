import axios from 'axios';
import cytoscape from 'cytoscape';
import contextMenus from 'cytoscape-context-menus';
import 'cytoscape-context-menus/cytoscape-context-menus.css';
import dagre from 'cytoscape-dagre';
import edgehandles from 'cytoscape-edgehandles';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import CytoscapeComponent from 'react-cytoscapejs';
import { Overlay } from 'react-overlays';
import { TokenContext } from './Home';
import './TechTree.css';
cytoscape.use(dagre);
cytoscape.use(edgehandles);
cytoscape.use(contextMenus);


const TechTree = () => {
    const cyRef = React.useRef();
    const containerRef = useRef();
    const isCyInitialized = useRef(false);
    const [elements, setElements] = useState([]);
    const token = useContext(TokenContext); // Assuming you're using Context API to store the token
    const [show, setShow] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        year: '',
        parentTech: 'None',
        childTech: 'None'
    });
    const [parentTechFilter, setParentTechFilter] = useState('');
    const [childTechFilter, setChildTechFilter] = useState('');

    const [cyPan, setCyPan] = useState([0, 0]);
    const [cyZoom, setCyZoom] = useState(1);
    const [isReady, setIsReady] = useState(false);

    const handleClick = (event) => {
        setShow(!show);
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
            (formData.parentTech !== 'None') && addEdge(label2id(formData.parentTech), newNodeId);
            // If the user selected a child tech, create an edge between the new node and the child tech
            (formData.childTech !== 'None') && addEdge(newNodeId, label2id(formData.childTech));
            // Refresh cytoscapes elements
            fetchData();
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

        } catch (error) {
            console.error('Error creating edge:', error);
        }
    };

    const removeEdge = async (edge) => {
        try {
            const response = await axios.delete(`/api/edges/${edge}`);
            fetchData();
        } catch (error) {
            console.error('Error deleting edge:', error);
        }
    };

    const removeNode = async (node) => {
        try {
            const nodeData = node._private.data;
            // First, delete all edges connected to the node
            const response = await axios.get('/api/edges');
            const edges = response.data;
            edges.forEach(edge => {
                if (edge.source_node_id === Number(nodeData.id) || edge.target_node_id === Number(nodeData.id)) {
                    removeEdge(edge.id);
                }
            });
            const response2 = await axios.delete(`/api/nodes/${nodeData.id}`);
            fetchData();


        } catch (error) {
            console.error('Error deleting node:', error);
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
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

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

    useEffect(() => {
        fetchData();
        const container = containerRef.current;
        const cy = cyRef.current;

        const handleWheel = (e) => {
            e.preventDefault(); // Prevent the default browser scrolling
            const deltaMode = e.deltaMode;
            const deltaY = e.deltaY;
            const deltaX = e.deltaX;

            let amountX, amountY;

            if (deltaMode === 1) { // If in line mode (usually when using a touchpad)
                amountX = deltaX * 10; // Adjust the multiplier as per your sensitivity preferences
                amountY = deltaY * 10;
            } else { // If in pixel mode (usually when using a mouse wheel)
                amountX = deltaX;
                amountY = deltaY;
            }

            cy.panBy({ x: -1 * amountX, y: -1 * amountY });
        };

        container.addEventListener('wheel', handleWheel);

        return () => container.removeEventListener('wheel', handleWheel); // Cleanup the event listener on component unmount
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.metaKey && !e.ctrlKey) return;

            if (e.key === '=' || e.key === '-') {
                e.preventDefault();

                const factor = e.key === '=' ? 1.5 : 0.75;
                const currentZoom = cyRef.current.zoom();
                const newZoom = currentZoom * factor;

                // Get current viewport center
                const currentCenter = cyRef.current.getCenterPan(newZoom);

                // Temporarily disable panning
                cyRef.current.panningEnabled(false);

                // Set new zoom and center
                cyRef.current.viewport({
                    zoom: newZoom,
                    pan: currentCenter,
                });

                // Re-enable panning
                cyRef.current.panningEnabled(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const cy = cyRef.current;
        if (cy && elements.length) {
            setIsReady(true);
        }
    }, [cyRef.current, elements]);
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
        if (isReady) {
            const layout = cy.layout({
                name: 'dagre',
                animate: false,
                nodeSep: 1,
                avoidOverlap: true,
                nodeDimensionsIncludeLabels: true,
                rankDir: 'TB',
                spacingFactor: 2,
                fit: false,
                padding: 30,
                infinite: true

            });
            console.log('layout');
            layout.run();
            cy.fit();
            function verticalPos(x) {

                if (x >= 2023) {
                    return 0;
                }
                else if (x >= 1903) {
                    return 100 * (2023 - x) / 10;
                    // so at 1903 we are at 1200
                }
                else if (x >= 1503) {
                    return 1200 + 100 * (1903 - x) / 50;
                    // so at 1503 we are at 2000
                }
                else if (x >= -997) {
                    return 2000 + 100 * (1503 - x) / 100;
                    // so at -1003 we are at 4500
                }
                else if (x >= -14997) {
                    return 4500 + 100 * (-997 - x) / 1000;
                    // so at -14997 we are at 5900
                }
                else {
                    return 5900 + 100 * (-9997 - x) / 100000;
                }
            }


            cy.nodes().forEach(node => {
                let year = node.data('year');
                let yPos = verticalPos(year);
                node.position({
                    y: yPos
                });
            });

            const NODE_WIDTH = 400;
            const NODE_HEIGHT = 100;
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
                cy.style().selector('edge').style({
                    'line-color': function (edge) {
                        let sourceYear = edge.source().data('year');
                        let targetYear = edge.target().data('year');
                        if (sourceYear < targetYear) {
                            console.log('sourceYear > targetYear');
                            return '#002fa7';
                        }
                        else {
                            console.log('sourceYear < targetYear');
                            return '#8B0000';
                        }
                    }
                }).update();
            }


            // Call the function to apply the styling
            applyConditionalStyling(cy);
            var eh = cy.edgehandles(
                {
                    canConnect: function (sourceNode, targetNode) {
                        //disallow loops
                        //TODO add more checks here
                        //check if the nodes are already connected

                        if (sourceNode.outgoers().targets().includes(targetNode)) {
                            return false;
                        }
                        if (targetNode.outgoers().targets().includes(sourceNode)) {
                            return false;
                        }



                        return !sourceNode.same(targetNode); // e.g. disallow loops
                    },
                    disableBrowserGestures: false,
                }
            );
            cy.on('tap', 'node', function (evt) {
                cy.elements().removeClass('highlighted');
                evt.target.connectedEdges().addClass('highlighted');
                evt.target.addClass('highlighted');
            });
            // eh.enableDrawMode();
            const options = {
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
                            const target = event.target;
                            if (target.isNode()) {
                                // Get the data of the node
                                const nodeData = target.data();
                                removeNode(target);
                            }
                            else {
                                const edgeData = target.data();
                                console.log(edgeData);
                                const edgeId = edgeData.id.slice(4);
                                removeEdge(edgeId);
                            }
                        }
                    },
                    {
                        id: 'select-branch',
                        content: 'Select Branch',
                        tooltipText: 'Select Branch',
                        selector: 'node',
                        onClickFunction: function (event) {
                            const target = event.target || event.cyTarget;
                            target.select()
                            target.predecessors().select();
                            target.successors().select();
                            target.addClass('highlighted');
                            target.predecessors().addClass('highlighted');
                            target.successors().addClass('highlighted');
                        }
                    },
                    {
                        id: 'add-tech',
                        content: 'Add Technology',
                        tooltipText: 'Add Technology',
                        // selector - neither node nor edge
                        coreAsWell: true,
                        onClickFunction: handleClick,
                    },

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
            cy.on('ehcomplete', (event, sourceNode, targetNode, addedEdge) => {
                if (!addedEdge) {
                    return;
                }

                Number.isInteger(Number(sourceNode.id())) && Number.isInteger(Number(targetNode.id())) && addEdge(sourceNode.id(), targetNode.id());

            });


            // // on click on background remove all highlights and selctions
            // cy.on('tap', function (event) {
            //     if (event.target === cy) {
            //         cy.elements().removeClass('highlighted');
            //         cy.elements().unselect();
            //     }
            // }
            // );

            //record camera position and zoom level to React state
            // cy.on('zoom', function (event) {
            //     setCyZoom(cy.zoom());
            //     setCyPan(cy.pan());
            // }
            // );

            // cy.on('pan', function (event) {
            //     setCyZoom(cy.zoom());
            //     setCyPan(cy.pan());
            // }
            // );


            // set camera position to show all nodes
            cy.fit();
        }
    }, [isReady]);



    const style = [{
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

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'auto' }} ref={containerRef}>
            <p></p>
            <div>
                {/* <Button onClick={handleClick} style={{ backgroundColor: '#ffffff', borderColor: '#002fa7', borderRadius: '4px' }}>
                    Add Technology
                </Button> */}

                <Overlay show={show} placement="top">
                    {({ props, arrowProps }) => (
                        <div {...props} className="custom-overlay" style={{
                            ...props.style,
                            position: 'fixed', // Use 'fixed' or 'absolute'
                            top: '50%', // Center vertically
                            left: '50%', // Center horizontally
                            transform: 'translate(-50%, -50%)', // Necessary adjustments for centering
                            zIndex: 999 // Optional: to ensure the overlay is above other elements
                        }}>
                            <div {...arrowProps} className="custom-arrow" style={{ ...arrowProps.style, zIndex: 1000 }} />
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
                                <p></p>
                                <Button onClick={handleClick} style={{ backgroundColor: '#ffffff', borderColor: '#002fa7', borderRadius: '4px' }}>
                                    Cancel
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
                style={{ width: '100%', height: '100%' }}
                stylesheet={style}
                cy={(cy) => {
                    // make sure we only init this once
                    // if (isCyInitialized.current) return;
                    // isCyInitialized.current = true;
                    cyRef.current = cy;
                    // cy.userPanningEnabled(false);
                    cy.userZoomingEnabled(false);



                }}
            />
        </div >
    );
};

export default TechTree;

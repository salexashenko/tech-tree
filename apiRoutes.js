const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { Node, Edge, User } = require('./models');

console.log("User imported in apiRoutes.js:", User);






// Middleware for JWT authentication
const authenticateJWT = (req, res, next) => {
    // strip the Bearer prefix
    const token = req.header('Authorization').split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access token is missing' });
    }
    jwt.verify(token, 'your_secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Register a new user
router.post('/register', [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newUser = await User.create({ username, email, password_hash: hashedPassword });
        const token = jwt.sign({ username }, 'your_secret_key', { expiresIn: '1h' });
        res.status(201).json({ token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error registering user', error });
    }
});

// User login
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        const user = await User.findOne({ where: { username } });
        if (user) {
            const passwordMatches = await bcrypt.compare(password, user.password_hash);
            if (passwordMatches) {
                const token = jwt.sign({ username }, 'your_secret_key', { expiresIn: '1h' });
                res.json({ token });
            } else {
                res.status(401).json({ message: 'Invalid password' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
});

// Get user details (for the currently authenticated user)
router.get('/me', async (req, res) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ message: 'Access token is missing' });
    }

    jwt.verify(token, 'your_secret_key', async (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        try {
            const userDetails = await User.findOne({ where: { username: user.username } });
            if (userDetails) {
                res.json({ username: userDetails.username, email: userDetails.email });
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving user details', error });
        }
    });
});

// Get all nodes
router.get('/nodes', async (req, res) => {
    try {
        const nodes = await Node.findAll();
        res.json(nodes);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving nodes', error });
    }
});

// Get a single node by ID
router.get('/nodes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const node = await Node.findByPk(id);
        if (node) {
            res.json(node);
        } else {
            res.status(404).json({ message: 'Node not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving node', error });
    }
});

// Create a new node
router.post('/nodes', authenticateJWT, [
    body('label').isString().isLength({ min: 1 }),
    body('year').optional().isInt(),
    body('link').optional().isURL(),
    body('image_URL').optional().isURL()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const newNode = await Node.create(req.body);
        res.status(201).json(newNode);
    } catch (error) {
        res.status(500).json({ message: 'Error creating node', error });
    }
});

// Update a node by ID
router.put('/nodes/:id', authenticateJWT, [
    body('label').optional().isString().isLength({ min: 1 }),
    body('year').optional().isInt(),
    body('link').optional().isURL(),
    body('image_URL').optional().isURL()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    try {
        const node = await Node.findByPk(id);
        if (node) {
            await node.update(req.body);
            res.json(node);
        } else {
            res.status(404).json({ message: 'Node not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating node', error });
    }
});

// Delete a node by ID
router.delete('/nodes/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const node = await Node.findByPk(id);
        if (node) {
            await node.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ message: 'Node not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting node', error });
    }
});


// Get all edges
router.get('/edges', async (req, res) => {
    try {
        const edges = await Edge.findAll();
        res.json(edges);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving edges', error });
    }
});

// Get a single edge by ID
router.get('/edges/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const edge = await Edge.findByPk(id);
        if (edge) {
            res.json(edge);
        } else {
            res.status(404).json({ message: 'Edge not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving edge', error });
    }
});

// Create a new edge
router.post('/edges', authenticateJWT, [
    body('source_node_id').isInt(),
    body('target_node_id').isInt(),
    // check that source_node_id and target_node_id are not the same
    body('source_node_id').custom((value, { req }) => {
        if (value === req.body.target_node_id) {
            throw new Error('Source node and target node cannot be the same');
        }
        return true;
    }),
    // check that source_node_id and target_node_id are not already connected
    body('source_node_id').custom(async (value, { req }) => {
        const edge = await Edge.findOne({ where: { source_node_id: value, target_node_id: req.body.target_node_id } });
        if (edge) {
            throw new Error('Source node and target node are already connected');
        }
        return true;
    }),
    // check for circular reference
    body('source_node_id').custom(async (value, { req }) => {
        const edge = await Edge.findOne({ where: { source_node_id: req.body.target_node_id, target_node_id: value } });
        if (edge) {
            throw new Error('Source node and target node are already connected');
        }
        return true;
    }),
    // check that source_node_id and target_node_id exist
    body('source_node_id').custom(async (value) => {
        const node = await Node.findByPk(value);
        if (!node) {
            throw new Error('Source node does not exist');
        }
        return true;
    }),
    body('target_node_id').custom(async (value) => {
        const node = await Node.findByPk(value);
        if (!node) {
            throw new Error('Target node does not exist');
        }
        return true;
    })


], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const newEdge = await Edge.create(req.body);
        res.status(201).json(newEdge);
    } catch (error) {
        res.status(500).json({ message: 'Error creating edge', error });
    }
});

// Update an edge by ID
router.put('/edges/:id', authenticateJWT, [
    body('source_node_id').optional().isInt(),
    body('target_node_id').optional().isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    try {
        const edge = await Edge.findByPk(id);
        if (edge) {
            await edge.update(req.body);
            res.json(edge);
        } else {
            res.status(404).json({ message: 'Edge not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating edge', error });
    }
});

// Delete an edge by ID
router.delete('/edges/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const edge = await Edge.findByPk(id);
        if (edge) {
            await edge.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ message: 'Edge not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting edge', error });
    }
});

module.exports = router;
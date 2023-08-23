const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const bodyParser = require('body-parser');
const app = express();
const port = 3001; // Changed to avoid conflict with React's default port
const apiRoutes = require('./apiRoutes');

// Initialize database
const init = async () => {
    await sequelize.sync();
};

// Middleware
app.use(cors()); // Enables CORS for all routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', apiRoutes);

// Status Check
app.get('/', (req, res) => {
    res.json({ status: 'API is running' });
});

// Initialize and Start Server
init().then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
});

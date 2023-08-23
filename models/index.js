const { Sequelize, Model, DataTypes } = require('sequelize');
// Initialize Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL);
// Nodes Table
class Node extends Model { }
Node.init({
    label: DataTypes.STRING,
    year: DataTypes.INTEGER,
    link: DataTypes.STRING,
    image_url: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
}, { sequelize, modelName: 'node', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

// Edges Table
class Edge extends Model { }
Edge.init({
    source_node_id: DataTypes.INTEGER,
    target_node_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
}, { sequelize, modelName: 'edge', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

// Users Table
class User extends Model { }
User.init({
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
}, { sequelize, modelName: 'user', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

console.log("User defined in app.js:", User);
// Update Bundles Table
class UpdateBundle extends Model { }
UpdateBundle.init({
    user_id: DataTypes.INTEGER,
    change_note: DataTypes.STRING,
    created_at: DataTypes.DATE
}, { sequelize, modelName: 'update_bundle', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

// Node Updates Table
class NodeUpdate extends Model { }
NodeUpdate.init({
    user_id: DataTypes.INTEGER,
    node_id: DataTypes.INTEGER,
    bundle_id: DataTypes.INTEGER,
    created: DataTypes.BOOLEAN,
    deleted: DataTypes.BOOLEAN,
    label_old: DataTypes.STRING,
    label_new: DataTypes.STRING,
    year_old: DataTypes.INTEGER,
    year_new: DataTypes.INTEGER,
    link_old: DataTypes.STRING,
    link_new: DataTypes.STRING,
    image_url_old: DataTypes.STRING,
    image_url_new: DataTypes.STRING,
    created_at: DataTypes.DATE,
    rolled_back_at: DataTypes.DATE
}, { sequelize, modelName: 'node_update', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

// Edge Updates Table
class EdgeUpdate extends Model { }
EdgeUpdate.init({
    user_id: DataTypes.INTEGER,
    edge_id: DataTypes.INTEGER,
    bundle_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    rolled_back_at: DataTypes.DATE
}, { sequelize, modelName: 'edge_update', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });


module.exports = { sequelize, Node, Edge, User, UpdateBundle, NodeUpdate, EdgeUpdate };

"use strict";
/**
 * MCP Agent Server
 * Autonomous storefront generation using Claude
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const agent_1 = require("./agent");
// Load environment variables
dotenv_1.default.config();
// Polyfill fetch for Supabase
if (!globalThis.fetch) {
    globalThis.fetch = node_fetch_1.default;
}
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Security middleware
app.use((req, res, next) => {
    const secret = req.headers.authorization?.replace('Bearer ', '');
    // Allow health checks without auth
    if (req.path === '/health') {
        return next();
    }
    if (!process.env.MCP_AGENT_SECRET || secret !== process.env.MCP_AGENT_SECRET) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    next();
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'yacht-club-agent',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});
// Main generation endpoint
app.post('/api/generate-storefront', async (req, res) => {
    try {
        const { vendorId, vendorData } = req.body;
        if (!vendorId || !vendorData) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: vendorId, vendorData'
            });
        }
        if (!vendorData.store_name || !vendorData.slug) {
            return res.status(400).json({
                success: false,
                error: 'vendorData must include store_name and slug'
            });
        }
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🤖 AGENT STARTING: ${vendorData.store_name}`);
        console.log(`${'='.repeat(60)}\n`);
        // Generate storefront using Claude agent
        const result = await (0, agent_1.generateStorefrontWithAgent)(vendorId, vendorData);
        console.log(`\n${'='.repeat(60)}`);
        if (result.success) {
            console.log(`✅ AGENT SUCCESS: ${vendorData.store_name}`);
            console.log(`   Sections: ${result.sectionsCreated}`);
            console.log(`   Components: ${result.componentsCreated}`);
            console.log(`   URL: ${result.storefrontUrl}`);
        }
        else {
            console.log(`❌ AGENT FAILED: ${vendorData.store_name}`);
            console.log(`   Errors: ${result.errors?.join(', ')}`);
        }
        console.log(`${'='.repeat(60)}\n`);
        // Return result
        res.json(result);
    }
    catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});
// Test endpoint (for development)
app.post('/api/test', async (req, res) => {
    res.json({
        success: true,
        message: 'Agent server is working',
        timestamp: new Date().toISOString()
    });
});
// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n${'🚀'.repeat(30)}`);
    console.log(`   YACHT CLUB AI AGENT SERVER RUNNING`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Ready to generate storefronts!`);
    console.log(`${'🚀'.repeat(30)}\n`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM signal received: closing server');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('🛑 SIGINT signal received: closing server');
    process.exit(0);
});

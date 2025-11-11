// npm run dev
// npm run start

const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'src' directory
app.use(express.static(path.join(__dirname, 'src')));

// Explicitly serve index.html on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Endpoint to provide configuration
app.get('/config', (req, res) => {
    const config = {
        wsUrl: process.env.NODE_ENV === 'production'
            ? process.env.PROD_WEBSOCKET_URL
            : process.env.DEV_WEBSOCKET_URL
    };
    res.json(config);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Current environment: ${process.env.NODE_ENV || 'development'}`);
});



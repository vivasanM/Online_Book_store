const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const booksRoutes = require('./routes/booksRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const app = express();
const cors = require('cors');
const setupDatabase = require('./database/setup');

const port = process.env.APP_PORT || 3000;

// CORS options
const corsOptions = {
	origin: (origin, callback) => {
		const allowedOrigins = ['http://127.0.0.1:8080', 'http://127.0.0.1:5500']; // your frontend URL
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	},
};

// Middleware
app.use(bodyParser.json());
app.use('/api', cors(corsOptions));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reports', reportsRoutes);

// Run setup before starting server
setupDatabase().then(() => {
	app.listen(port, () => {
		console.log(`Server running at http://localhost:${port}`);
	});
});

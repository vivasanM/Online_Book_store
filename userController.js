const { pool } = require('../database/db');

// CREATE user
const createUser = async (req, res) => {
	const client = await pool.connect();
	try {
		const { name, email, password, role } = req.body;

		// Check if user already exists
		const existingUser = await client.query(
			`SELECT * FROM users WHERE email = $1`,
			[email]
		);

		if (existingUser.rows.length > 0) {
			return res
				.status(409)
				.json({ error: 'User with this email already exists' });
		}

		// Insert new user
		const result = await client.query(
			`INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4) RETURNING *`,
			[name, email, password, role]
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		console.error(err);
		res.status(500).send('Error creating user');
	} finally {
		client.release();
	}
};

// LOGIN user
const loginUser = async (req, res) => {
	const client = await pool.connect();
	try {
		const { email, password } = req.body;

		// Check if user exists
		const userResult = await client.query(
			`SELECT * FROM Users WHERE email = $1`,
			[email]
		);

		if (userResult.rows.length === 0) {
			return res.status(401).json({ error: 'Invalid email or password' });
		}

		const user = userResult.rows[0];

		// For plain text password comparison (not secure)
		if (user.password !== password) {
			return res.status(401).json({ error: 'Invalid email or password' });
		}

		// Optional: generate JWT token here
		// const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

		res.status(200).json({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		});
	} catch (err) {
		console.error(err);
		res.status(500).send('Error logging in user');
	} finally {
		client.release();
	}
};

module.exports = {
	createUser,
	loginUser,
};

const { pool } = require('../database/db');

async function getAllBooks(req, res) {
	const client = await pool.connect();
	try {
		const result = await client.query('SELECT * FROM Books ORDER BY book_id');
		res.json(result.rows);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server error');
	} finally {
		client.release();
	}
}

async function addBook(req, res) {
	const client = await pool.connect();
	try {
		const { title, author, imagelink, quantity, price } = req.body;

		// Basic validation
		if (!title || !author || !imagelink || !quantity || !price) {
			return res.status(400).json({ message: 'All fields are required' });
		}

		const insertQuery = `
			INSERT INTO Books (title, author, image_link, stock_quantity, price)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING *;
		`;

		const values = [title, author, imagelink, quantity, price];

		const result = await client.query(insertQuery, values);

		res.status(201).json({
			message: 'Book added successfully',
			book: result.rows[0],
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server error');
	} finally {
		client.release();
	}
}

// ---- NEW updateBook FUNCTION ----
async function updateBook(req, res) {
	const client = await pool.connect();
	try {
		const bookId = req.params.id; // assuming route is /books/:id
		const { title, author, imagelink, quantity, price } = req.body;

		if (!title || !author || !imagelink || !quantity || !price) {
			return res.status(400).json({ message: 'All fields are required' });
		}

		const updateQuery = `
            UPDATE Books
            SET title = $1,
                author = $2,
                image_link = $3,
                stock_quantity = $4,
                price = $5
            WHERE book_id = $6
            RETURNING *;
        `;

		const values = [title, author, imagelink, quantity, price, bookId];
		const result = await client.query(updateQuery, values);

		if (result.rowCount === 0) {
			return res.status(404).json({ message: 'Book not found' });
		}

		res.json({
			message: 'Book updated successfully',
			book: result.rows[0],
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server error');
	} finally {
		client.release();
	}
}

module.exports = {
	getAllBooks,
	addBook,
	updateBook,
};

const { pool } = require('../database/db');

const getAllOrdersByUser = async (req, res) => {
	const client = await pool.connect();
	try {
		const userId = req.params.userId; // assuming route: /orders/:userId

		const result = await client.query(
			`
            SELECT 
                o.id,
                o.created_at AS orderdate,
                o.total_amount,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'bookid', oi.book_id,
                            'quantity', oi.quantity,
                            'price', oi.price
                        )
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'
                ) AS items
            FROM Orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = $1
            GROUP BY o.id
            ORDER BY o.id DESC
        `,
			[userId]
		);

		res.json(result.rows);
	} catch (err) {
		console.error(err);
		res.status(500).send('Error fetching orders');
	} finally {
		client.release();
	}
};

const createOrder = async (req, res) => {
	const { userId, items } = req.body;
	const client = await pool.connect();

	try {
		await client.query('BEGIN');

		const insufficientStockBooks = [];
		// Check stock availability for each item
		for (let item of items) {
			const stockRes = await client.query(
				'SELECT stock_quantity FROM Books WHERE book_id = $1',
				[item.bookId]
			);

			if (stockRes.rows.length === 0) {
				throw new Error(`Book with ID ${item.bookId} not found`);
			}

			const availableStock = stockRes.rows[0].stock_quantity;
			if (availableStock < item.quantity) {
				insufficientStockBooks.push({
					book_id: item.bookId,
					quantity: availableStock,
					requested: item.quantity,
				});
			}
		}
		if (insufficientStockBooks.length > 0) {
			await client.query('COMMIT');
			res.status(400).json({
				error: 'Insufficient stocks for books',
				data: insufficientStockBooks,
			});
		} else {
			// Calculate total amount
			let totalAmount = 0;
			items.forEach((item) => (totalAmount += item.quantity * item.price));
			// Insert order
			const orderRes = await client.query(
				'INSERT INTO Orders (user_id, total_amount) VALUES ($1, $2) RETURNING *',
				[userId, totalAmount]
			);

			const orderId = orderRes.rows[0].id;

			// Insert order items
			for (let item of items) {
				await client.query(
					`INSERT INTO order_items (order_id, book_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
					[orderId, item.bookId, item.quantity, item.quantity * item.price]
				);
			}

			await client.query('COMMIT');
			res.status(201).json({ orderId, totalAmount });
		}
	} catch (err) {
		await client.query('ROLLBACK');
		console.error(err);
		res.status(500).send('Error creating order');
	} finally {
		client.release();
	}
};

module.exports = {
	getAllOrdersByUser,
	createOrder,
};

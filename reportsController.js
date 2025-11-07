// controllers/reportsController.js
const { pool } = require('../database/db');

// Controller for monthly sales report
exports.getBookSalesReport = async (req, res) => {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// 2️⃣ Call the stored procedure
		await client.query('CALL sp_book_wise_sales_report();');

		// 3️⃣ Fetch data from the temp table
		const result = await client.query('SELECT * FROM temp_book_wise_sales');

		// 4️⃣ Commit transaction
		await client.query('COMMIT');

		res.json({
			data: result.rows,
		});
	} catch (err) {
		console.error('❌ Failed to fetch book sales report:', err);
		res.status(500).json({ message: 'Server error' });
	} finally {
		client.release();
	}
};

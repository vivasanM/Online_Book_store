require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');
const { sampleBooks } = require('./sampleBooks');

async function runSqlFile(filePath) {
	const sql = fs.readFileSync(filePath, 'utf8');
	await pool.query(sql);
	console.log(`✅ Executed ${path.basename(filePath)}`);
}

async function setupDatabase() {
	try {
		const sqlFiles = ['users.sql', 'books.sql', 'orders.sql'];

		for (const file of sqlFiles) {
			const filePath = path.join(__dirname, 'scripts', file);
			await runSqlFile(filePath);
		}

		// 2️⃣ Check if trigger exists
		const checkTriggerSql = fs.readFileSync(
			path.join(__dirname, 'scripts', 'check_trigger.sql'),
			'utf8'
		);
		const result = await pool.query(checkTriggerSql);

		// 3️⃣ Create trigger only if it does not exist
		if (result.rowCount === 0) {
			await runSqlFile(
				path.join(__dirname, 'scripts', 'update_book_stock.sql')
			);
			await runSqlFile(
				path.join(__dirname, 'scripts', 'create_trigger.sql')
			);
			console.log('✅ Trigger created');
		} else {
			console.log('✅ Trigger already exists');
		}

		// run the SP creation SQL
		await runSqlFile(
			path.join(__dirname, 'scripts', 'sp_book_sales_report.sql')
		);

		console.log('✅ All SQL scripts executed successfully!');

		// console.log('Dropping all books...');
		// await pool.query('DELETE FROM Books'); // or TRUNCATE for faster reset
		// console.log('✅ All books deleted');

		// console.log(`Loading sample books`);
		// for (const book of sampleBooks) {
		// 	await pool.query(
		// 		`INSERT INTO Books (title, author, price, stock_quantity, image_link) 
        // VALUES ($1, $2, $3, $4, $5)`,
		// 		[book.title, book.author, book.price, book.stock, book.imageLink]
		// 	);
		// }
		// console.log(`Sample Books Loaded`);
	} catch (err) {
		console.error('❌ Failed to setup database:', err);
		throw err;
	}
}

module.exports = setupDatabase;

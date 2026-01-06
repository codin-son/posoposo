const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

(async () => {
    const username = 'admin';
    const password = 'admin123';
    const result = await db.query(
        'SELECT * FROM users WHERE username = $1 AND is_active = true',
        [username]
    );

    if (result.rows.length === 0) {
        console.error('Invalid credentials');
        return;
    }
    console.log(result);

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
        console.error('Invalid credentials');
        return;
    }
})();


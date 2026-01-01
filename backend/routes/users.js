const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, requireSuperadmin, requireBossOrAbove } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireBossOrAbove, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username, role, full_name, phone, is_active, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', authenticateToken, requireSuperadmin, async (req, res) => {
    try {
        const { username, password, role, fullName, phone } = req.body;

        if (!username || !password || !fullName) {
            return res.status(400).json({ error: 'Username, password, and full name are required' });
        }

        const existingUser = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            `INSERT INTO users (username, password, role, full_name, phone)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, username, role, full_name, phone, is_active, created_at`,
            [username, hashedPassword, role || 'staff', fullName, phone]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/:id', authenticateToken, requireSuperadmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, role, fullName, phone, isActive } = req.body;

        const result = await db.query(
            `UPDATE users SET username = $1, role = $2, full_name = $3, phone = $4, is_active = $5, updated_at = NOW()
             WHERE id = $6 RETURNING id, username, role, full_name, phone, is_active, created_at`,
            [username, role, fullName, phone, isActive, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/reset-password', authenticateToken, requireSuperadmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ error: 'New password is required' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, id]);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', authenticateToken, requireSuperadmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

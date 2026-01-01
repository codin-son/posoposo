const express = require('express');
const db = require('../db');
const { authenticateToken, requireBossOrAbove } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(process.env.UPLOAD_DIR || './uploads', 'menu'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM menu_categories ORDER BY display_order');
        res.json(result.rows);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/categories', authenticateToken, requireBossOrAbove, async (req, res) => {
    try {
        const { name, displayOrder } = req.body;
        const result = await db.query(
            'INSERT INTO menu_categories (name, display_order) VALUES ($1, $2) RETURNING *',
            [name, displayOrder || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/categories/:id', authenticateToken, requireBossOrAbove, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, displayOrder } = req.body;
        const result = await db.query(
            'UPDATE menu_categories SET name = $1, display_order = $2 WHERE id = $3 RETURNING *',
            [name, displayOrder, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/categories/:id', authenticateToken, requireBossOrAbove, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM menu_categories WHERE id = $1', [id]);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/items', authenticateToken, async (req, res) => {
    try {
        const { category, available } = req.query;
        let query = `
            SELECT mi.*, mc.name as category_name 
            FROM menu_items mi 
            LEFT JOIN menu_categories mc ON mi.category_id = mc.id
            WHERE 1=1
        `;
        const params = [];

        if (category) {
            params.push(category);
            query += ` AND mi.category_id = $${params.length}`;
        }
        if (available === 'true') {
            query += ' AND mi.is_available = true';
        }

        query += ' ORDER BY mc.display_order, mi.name';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get items error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/items', authenticateToken, requireBossOrAbove, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, categoryId, isAvailable } = req.body;
        const imageUrl = req.file ? `/uploads/menu/${req.file.filename}` : null;

        const result = await db.query(
            `INSERT INTO menu_items (name, description, price, category_id, image_url, is_available)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, description, price, categoryId || null, imageUrl, isAvailable !== 'false']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create item error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/items/:id', authenticateToken, requireBossOrAbove, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, categoryId, isAvailable } = req.body;
        
        let query, params;
        if (req.file) {
            const imageUrl = `/uploads/menu/${req.file.filename}`;
            query = `UPDATE menu_items SET name = $1, description = $2, price = $3, category_id = $4, 
                     image_url = $5, is_available = $6, updated_at = NOW() WHERE id = $7 RETURNING *`;
            params = [name, description, price, categoryId || null, imageUrl, isAvailable !== 'false', id];
        } else {
            query = `UPDATE menu_items SET name = $1, description = $2, price = $3, category_id = $4, 
                     is_available = $5, updated_at = NOW() WHERE id = $6 RETURNING *`;
            params = [name, description, price, categoryId || null, isAvailable !== 'false', id];
        }

        const result = await db.query(query, params);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/items/:id/availability', authenticateToken, requireBossOrAbove, async (req, res) => {
    try {
        const { id } = req.params;
        const { isAvailable } = req.body;
        const result = await db.query(
            'UPDATE menu_items SET is_available = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [isAvailable, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/items/:id', authenticateToken, requireBossOrAbove, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM menu_items WHERE id = $1', [id]);
        res.json({ message: 'Item deleted' });
    } catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/discounts', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM discounts WHERE is_active = true ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Get discounts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/discounts', authenticateToken, requireBossOrAbove, async (req, res) => {
    try {
        const { code, name, type, value, expiryDate } = req.body;
        const result = await db.query(
            'INSERT INTO discounts (code, name, type, value, expiry_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [code, name, type, value, expiryDate || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create discount error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/discounts/validate/:code', authenticateToken, async (req, res) => {
    try {
        const { code } = req.params;
        const result = await db.query(
            `SELECT * FROM discounts WHERE code = $1 AND is_active = true 
             AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)`,
            [code]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired discount code' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Validate discount error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

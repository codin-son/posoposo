const express = require('express');
const db = require('../db');
const { authenticateToken, requireBossOrAbove } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { customerName, items, discountId, discountAmount, paymentReceived, paymentMethod, notes } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Order must have at least one item' });
        }

        const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const discount = discountAmount || 0;
        const sstResult = await db.query("SELECT value FROM system_settings WHERE key = 'sst_rate'");
        const sstRate = parseFloat(sstResult.rows[0]?.value || 0) / 100;
        const sstAmount = (subtotal - discount) * sstRate;
        const totalAmount = subtotal - discount + sstAmount;
        const changeGiven = paymentReceived - totalAmount;

        const orderResult = await db.query(
            `INSERT INTO orders (customer_name, staff_id, subtotal, discount_id, discount_amount, sst_amount, total_amount, payment_received, change_given, payment_method, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [customerName, req.user.id, subtotal, discountId || null, discount, sstAmount, totalAmount, paymentReceived, changeGiven, paymentMethod || 'cash', notes]
        );

        const order = orderResult.rows[0];

        for (const item of items) {
            await db.query(
                `INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, subtotal, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [order.id, item.menuItemId, item.name, item.quantity, item.unitPrice, item.unitPrice * item.quantity, item.notes]
            );
        }

        const completeOrder = await db.query(
            `SELECT o.*, u.full_name as staff_name FROM orders o
             LEFT JOIN users u ON o.staff_id = u.id WHERE o.id = $1`,
            [order.id]
        );

        const orderItems = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);

        res.status(201).json({ ...completeOrder.rows[0], items: orderItems.rows });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate, staffId, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT o.*, u.full_name as staff_name 
            FROM orders o
            LEFT JOIN users u ON o.staff_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            params.push(startDate);
            query += ` AND o.created_at >= $${params.length}::date`;
        }
        if (endDate) {
            params.push(endDate);
            query += ` AND o.created_at < ($${params.length}::date + interval '1 day')`;
        }
        if (staffId) {
            params.push(staffId);
            query += ` AND o.staff_id = $${params.length}`;
        }

        query += ' ORDER BY o.created_at DESC';
        params.push(limit, offset);
        query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const orderResult = await db.query(
            `SELECT o.*, u.full_name as staff_name FROM orders o
             LEFT JOIN users u ON o.staff_id = u.id WHERE o.id = $1`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const itemsResult = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
        res.json({ ...orderResult.rows[0], items: itemsResult.rows });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/today/summary', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount), 0) as total_sales,
                COALESCE(AVG(total_amount), 0) as average_order
            FROM orders 
            WHERE created_at >= CURRENT_DATE
        `);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get today summary error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

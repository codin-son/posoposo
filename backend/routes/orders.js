const express = require('express');
const db = require('../db');
const { authenticateToken, requireBossOrAbove } = require('../middleware/auth');

const router = express.Router();

// Create order (without payment - IN_PROGRESS status)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { customerName, items, discountId, discountAmount, notes } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Order must have at least one item' });
        }

        const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const discount = discountAmount || 0;
        const sstResult = await db.query("SELECT value FROM system_settings WHERE key = 'sst_rate'");
        const sstRate = parseFloat(sstResult.rows[0]?.value || 0) / 100;
        const sstAmount = (subtotal - discount) * sstRate;
        const totalAmount = subtotal - discount + sstAmount;

        const orderResult = await db.query(
            `INSERT INTO orders (customer_name, staff_id, subtotal, discount_id, discount_amount, sst_amount, total_amount, status, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'IN_PROGRESS', $8) RETURNING *`,
            [customerName, req.user.id, subtotal, discountId || null, discount, sstAmount, totalAmount, notes]
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

// Get orders with filters
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate, staffId, status, limit = 50, offset = 0 } = req.query;

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
        if (status) {
            params.push(status);
            query += ` AND o.status = $${params.length}`;
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

// Get single order with items
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

// Update order status (IN_PROGRESS -> READY)
router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['IN_PROGRESS', 'READY', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const orderCheck = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (orderCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const currentOrder = orderCheck.rows[0];
        if (currentOrder.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Cannot modify a completed order' });
        }

        const result = await db.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        const orderResult = await db.query(
            `SELECT o.*, u.full_name as staff_name FROM orders o
             LEFT JOIN users u ON o.staff_id = u.id WHERE o.id = $1`,
            [id]
        );

        const itemsResult = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
        res.json({ ...orderResult.rows[0], items: itemsResult.rows });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Process payment for order
router.put('/:id/pay', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentReceived, paymentMethod } = req.body;

        const orderCheck = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (orderCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const currentOrder = orderCheck.rows[0];
        if (currentOrder.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Order already paid' });
        }
        if (currentOrder.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Cannot pay for cancelled order' });
        }

        const totalAmount = parseFloat(currentOrder.total_amount);
        if (paymentReceived < totalAmount) {
            return res.status(400).json({ error: 'Payment amount is insufficient' });
        }

        const changeGiven = paymentReceived - totalAmount;

        await db.query(
            `UPDATE orders SET 
                payment_received = $1, 
                change_given = $2, 
                payment_method = $3, 
                status = 'COMPLETED',
                paid_at = NOW()
             WHERE id = $4`,
            [paymentReceived, changeGiven, paymentMethod || 'cash', id]
        );

        const orderResult = await db.query(
            `SELECT o.*, u.full_name as staff_name FROM orders o
             LEFT JOIN users u ON o.staff_id = u.id WHERE o.id = $1`,
            [id]
        );

        const itemsResult = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
        res.json({ ...orderResult.rows[0], items: itemsResult.rows });
    } catch (error) {
        console.error('Pay order error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get today's summary
router.get('/today/summary', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount), 0) as total_sales,
                COALESCE(AVG(total_amount), 0) as average_order
            FROM orders 
            WHERE created_at >= CURRENT_DATE AND status = 'COMPLETED'
        `);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get today summary error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

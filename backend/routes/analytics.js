const express = require('express');
const db = require('../db');
const { authenticateToken, requireBossOrAbove } = require('../middleware/auth');

const router = express.Router();

router.get('/daily', authenticateToken, requireBossOrAbove, async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        const summary = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount), 0) as total_sales,
                COALESCE(SUM(discount_amount), 0) as total_discounts,
                COALESCE(AVG(total_amount), 0) as average_order
            FROM orders 
            WHERE created_at::date = $1
        `, [targetDate]);

        const hourlyData = await db.query(`
            SELECT 
                EXTRACT(HOUR FROM created_at) as hour,
                COUNT(*) as orders,
                COALESCE(SUM(total_amount), 0) as sales
            FROM orders 
            WHERE created_at::date = $1
            GROUP BY EXTRACT(HOUR FROM created_at)
            ORDER BY hour
        `, [targetDate]);

        const topItems = await db.query(`
            SELECT 
                oi.item_name,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.subtotal) as total_sales
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.created_at::date = $1
            GROUP BY oi.item_name
            ORDER BY total_quantity DESC
            LIMIT 10
        `, [targetDate]);

        const paymentMethods = await db.query(`
            SELECT 
                payment_method,
                COUNT(*) as count,
                SUM(total_amount) as total
            FROM orders
            WHERE created_at::date = $1
            GROUP BY payment_method
        `, [targetDate]);

        res.json({
            summary: summary.rows[0],
            hourlyData: hourlyData.rows,
            topItems: topItems.rows,
            paymentMethods: paymentMethods.rows
        });
    } catch (error) {
        console.error('Get daily analytics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/weekly', authenticateToken, requireBossOrAbove, async (req, res) => {
    try {
        const { endDate } = req.query;
        const end = endDate || new Date().toISOString().split('T')[0];
        
        const dailyData = await db.query(`
            SELECT 
                created_at::date as date,
                COUNT(*) as orders,
                COALESCE(SUM(total_amount), 0) as sales
            FROM orders 
            WHERE created_at::date > ($1::date - interval '7 days') AND created_at::date <= $1::date
            GROUP BY created_at::date
            ORDER BY date
        `, [end]);

        const summary = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount), 0) as total_sales,
                COALESCE(AVG(total_amount), 0) as average_order
            FROM orders 
            WHERE created_at::date > ($1::date - interval '7 days') AND created_at::date <= $1::date
        `, [end]);

        const topItems = await db.query(`
            SELECT 
                oi.item_name,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.subtotal) as total_sales
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.created_at::date > ($1::date - interval '7 days') AND o.created_at::date <= $1::date
            GROUP BY oi.item_name
            ORDER BY total_quantity DESC
            LIMIT 10
        `, [end]);

        res.json({
            summary: summary.rows[0],
            dailyData: dailyData.rows,
            topItems: topItems.rows
        });
    } catch (error) {
        console.error('Get weekly analytics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/monthly', authenticateToken, requireBossOrAbove, async (req, res) => {
    try {
        const { month, year } = req.query;
        const targetMonth = month || (new Date().getMonth() + 1);
        const targetYear = year || new Date().getFullYear();

        const dailyData = await db.query(`
            SELECT 
                created_at::date as date,
                COUNT(*) as orders,
                COALESCE(SUM(total_amount), 0) as sales
            FROM orders 
            WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2
            GROUP BY created_at::date
            ORDER BY date
        `, [targetMonth, targetYear]);

        const summary = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount), 0) as total_sales,
                COALESCE(SUM(discount_amount), 0) as total_discounts,
                COALESCE(AVG(total_amount), 0) as average_order
            FROM orders 
            WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2
        `, [targetMonth, targetYear]);

        const categoryData = await db.query(`
            SELECT 
                COALESCE(mc.name, 'Uncategorized') as category,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.subtotal) as total_sales
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
            LEFT JOIN menu_categories mc ON mi.category_id = mc.id
            WHERE EXTRACT(MONTH FROM o.created_at) = $1 AND EXTRACT(YEAR FROM o.created_at) = $2
            GROUP BY mc.name
            ORDER BY total_sales DESC
        `, [targetMonth, targetYear]);

        const topItems = await db.query(`
            SELECT 
                oi.item_name,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.subtotal) as total_sales
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE EXTRACT(MONTH FROM o.created_at) = $1 AND EXTRACT(YEAR FROM o.created_at) = $2
            GROUP BY oi.item_name
            ORDER BY total_quantity DESC
            LIMIT 10
        `, [targetMonth, targetYear]);

        const comparison = await db.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM created_at) = $1 THEN total_amount ELSE 0 END), 0) as current_month,
                COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM created_at) = $1 - 1 OR ($1 = 1 AND EXTRACT(MONTH FROM created_at) = 12) THEN total_amount ELSE 0 END), 0) as previous_month
            FROM orders 
            WHERE EXTRACT(YEAR FROM created_at) = $2 OR ($1 = 1 AND EXTRACT(YEAR FROM created_at) = $2 - 1)
        `, [targetMonth, targetYear]);

        res.json({
            summary: summary.rows[0],
            dailyData: dailyData.rows,
            categoryData: categoryData.rows,
            topItems: topItems.rows,
            comparison: comparison.rows[0]
        });
    } catch (error) {
        console.error('Get monthly analytics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/export', authenticateToken, requireBossOrAbove, async (req, res) => {
    try {
        const { startDate, endDate, format = 'csv' } = req.query;

        const orders = await db.query(`
            SELECT 
                o.order_number,
                o.customer_name,
                u.full_name as staff_name,
                o.subtotal,
                o.discount_amount,
                o.sst_amount,
                o.total_amount,
                o.payment_received,
                o.change_given,
                o.payment_method,
                o.created_at
            FROM orders o
            LEFT JOIN users u ON o.staff_id = u.id
            WHERE o.created_at::date >= $1 AND o.created_at::date <= $2
            ORDER BY o.created_at
        `, [startDate, endDate]);

        if (format === 'csv') {
            const headers = 'Order #,Customer,Staff,Subtotal,Discount,SST,Total,Paid,Change,Method,Date\n';
            const rows = orders.rows.map(o => 
                `${o.order_number},"${o.customer_name || ''}","${o.staff_name}",${o.subtotal},${o.discount_amount},${o.sst_amount},${o.total_amount},${o.payment_received},${o.change_given},${o.payment_method},${o.created_at}`
            ).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=sales_${startDate}_${endDate}.csv`);
            res.send(headers + rows);
        } else {
            res.json(orders.rows);
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

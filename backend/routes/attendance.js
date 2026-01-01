const express = require('express');
const db = require('../db');
const { authenticateToken, requireBossOrAbove } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.post('/clock-in', authenticateToken, async (req, res) => {
    try {
        const { selfieData } = req.body;
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const existing = await db.query(
            'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
            [userId, today]
        );

        if (existing.rows.length > 0 && existing.rows[0].clock_in) {
            return res.status(400).json({ error: 'Already clocked in today' });
        }

        let selfieUrl = null;
        if (selfieData) {
            const base64Data = selfieData.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const filename = `${uuidv4()}.jpg`;
            const filepath = path.join(process.env.UPLOAD_DIR || './uploads', 'selfies', filename);
            fs.writeFileSync(filepath, buffer);
            selfieUrl = `/uploads/selfies/${filename}`;
        }

        const workStartResult = await db.query("SELECT value FROM system_settings WHERE key = 'work_start_time'");
        const lateThresholdResult = await db.query("SELECT value FROM system_settings WHERE key = 'late_threshold_minutes'");
        const workStart = workStartResult.rows[0]?.value || '09:00';
        const lateThreshold = parseInt(lateThresholdResult.rows[0]?.value || '15');

        const now = new Date();
        const [startHour, startMin] = workStart.split(':').map(Number);
        const lateTime = new Date(now);
        lateTime.setHours(startHour, startMin + lateThreshold, 0, 0);

        const status = now > lateTime ? 'late' : 'present';

        let result;
        if (existing.rows.length > 0) {
            result = await db.query(
                `UPDATE attendance SET clock_in = NOW(), clock_in_selfie = $1, status = $2 
                 WHERE id = $3 RETURNING *`,
                [selfieUrl, status, existing.rows[0].id]
            );
        } else {
            result = await db.query(
                `INSERT INTO attendance (user_id, clock_in, clock_in_selfie, status, date)
                 VALUES ($1, NOW(), $2, $3, $4) RETURNING *`,
                [userId, selfieUrl, status, today]
            );
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Clock in error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/clock-out', authenticateToken, async (req, res) => {
    try {
        const { selfieData } = req.body;
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const existing = await db.query(
            'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
            [userId, today]
        );

        if (existing.rows.length === 0 || !existing.rows[0].clock_in) {
            return res.status(400).json({ error: 'Must clock in first' });
        }

        if (existing.rows[0].clock_out) {
            return res.status(400).json({ error: 'Already clocked out today' });
        }

        let selfieUrl = null;
        if (selfieData) {
            const base64Data = selfieData.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const filename = `${uuidv4()}.jpg`;
            const filepath = path.join(process.env.UPLOAD_DIR || './uploads', 'selfies', filename);
            fs.writeFileSync(filepath, buffer);
            selfieUrl = `/uploads/selfies/${filename}`;
        }

        const result = await db.query(
            'UPDATE attendance SET clock_out = NOW(), clock_out_selfie = $1 WHERE id = $2 RETURNING *',
            [selfieUrl, existing.rows[0].id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Clock out error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/today', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const result = await db.query(
            'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
            [userId, today]
        );

        res.json(result.rows[0] || null);
    } catch (error) {
        console.error('Get today attendance error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/my-history', authenticateToken, async (req, res) => {
    try {
        const { month, year } = req.query;
        const userId = req.user.id;

        let query = 'SELECT * FROM attendance WHERE user_id = $1';
        const params = [userId];

        if (month && year) {
            query += ` AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`;
            params.push(month, year);
        }

        query += ' ORDER BY date DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get my history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/all', authenticateToken, requireBossOrAbove, async (req, res) => {
    try {
        const { userId, month, year, startDate, endDate } = req.query;

        let query = `
            SELECT a.*, u.full_name, u.username 
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (userId) {
            params.push(userId);
            query += ` AND a.user_id = $${params.length}`;
        }
        if (month && year) {
            params.push(month, year);
            query += ` AND EXTRACT(MONTH FROM a.date) = $${params.length - 1} AND EXTRACT(YEAR FROM a.date) = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            query += ` AND a.date >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            query += ` AND a.date <= $${params.length}`;
        }

        query += ' ORDER BY a.date DESC, u.full_name';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get all attendance error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/mark', authenticateToken, requireBossOrAbove, async (req, res) => {
    try {
        const { userId, date, status, notes } = req.body;

        const existing = await db.query(
            'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
            [userId, date]
        );

        let result;
        if (existing.rows.length > 0) {
            result = await db.query(
                'UPDATE attendance SET status = $1, notes = $2 WHERE id = $3 RETURNING *',
                [status, notes, existing.rows[0].id]
            );
        } else {
            result = await db.query(
                'INSERT INTO attendance (user_id, date, status, notes) VALUES ($1, $2, $3, $4) RETURNING *',
                [userId, date, status, notes]
            );
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

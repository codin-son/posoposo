const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { authenticateToken, requireSuperadmin } = require('../middleware/auth');

const router = express.Router();

const BACKUP_DIR = '/backups';

router.post('/create', authenticateToken, requireSuperadmin, async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${timestamp}.sql`;
        const filepath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        const dbUrl = process.env.DATABASE_URL;
        const command = `pg_dump "${dbUrl}" > "${filepath}"`;
        execSync(command);

        res.json({ message: 'Backup created successfully', filename });
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ error: 'Backup failed' });
    }
});

router.get('/list', authenticateToken, requireSuperadmin, async (req, res) => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            return res.json([]);
        }

        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.sql'))
            .map(f => {
                const stats = fs.statSync(path.join(BACKUP_DIR, f));
                return {
                    filename: f,
                    size: stats.size,
                    created: stats.mtime
                };
            })
            .sort((a, b) => b.created - a.created);

        res.json(files);
    } catch (error) {
        console.error('List backups error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/download/:filename', authenticateToken, requireSuperadmin, (req, res) => {
    try {
        const { filename } = req.params;
        const filepath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Backup not found' });
        }

        res.download(filepath);
    } catch (error) {
        console.error('Download backup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:filename', authenticateToken, requireSuperadmin, (req, res) => {
    try {
        const { filename } = req.params;
        const filepath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Backup not found' });
        }

        fs.unlinkSync(filepath);
        res.json({ message: 'Backup deleted' });
    } catch (error) {
        console.error('Delete backup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

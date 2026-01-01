require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');
const analyticsRoutes = require('./routes/analytics');
const backupRoutes = require('./routes/backup');
const settingsRoutes = require('./routes/settings');

const { setupBackupCron } = require('./services/backup');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(path.join(uploadDir, 'selfies'))) {
    fs.mkdirSync(path.join(uploadDir, 'selfies'), { recursive: true });
}
if (!fs.existsSync(path.join(uploadDir, 'menu'))) {
    fs.mkdirSync(path.join(uploadDir, 'menu'), { recursive: true });
}

app.use('/uploads', express.static(uploadDir));

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('/{*path}', (req, res) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        }
    });
}

setupBackupCron();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

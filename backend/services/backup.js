const cron = require('node-cron');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = '/backups';

function performBackup() {
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

        console.log(`Backup created: ${filename}`);

        cleanOldBackups();
    } catch (error) {
        console.error('Automated backup failed:', error);
    }
}

function cleanOldBackups() {
    try {
        const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        if (!fs.existsSync(BACKUP_DIR)) return;

        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.sql'));

        files.forEach(file => {
            const filepath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filepath);
            if (stats.mtime < cutoffDate) {
                fs.unlinkSync(filepath);
                console.log(`Deleted old backup: ${file}`);
            }
        });
    } catch (error) {
        console.error('Cleanup old backups failed:', error);
    }
}

function setupBackupCron() {
    cron.schedule('0 2 * * *', () => {
        console.log('Running scheduled backup...');
        performBackup();
    });
    console.log('Backup cron job scheduled for 2:00 AM daily');
}

module.exports = { setupBackupCron, performBackup };

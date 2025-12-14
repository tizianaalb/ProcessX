import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/admin/users - Get all users in the organization (or all for super_admin)
router.get('/users', adminController.getUsers);

// GET /api/admin/organizations - Get all organizations (super_admin only)
router.get('/organizations', adminController.getOrganizations);

// POST /api/admin/users - Create a new user
router.post('/users', adminController.createUser);

// PATCH /api/admin/users/:userId - Update user details
router.patch('/users/:userId', adminController.updateUser);

// DELETE /api/admin/users/:userId - Delete a user
router.delete('/users/:userId', adminController.deleteUser);

// POST /api/admin/users/:userId/reset-password - Admin reset user password
router.post('/users/:userId/reset-password', adminController.resetUserPassword);

// POST /api/admin/upgrade-to-super-admin - Upgrade user to super_admin (admin can upgrade self)
router.post('/upgrade-to-super-admin', adminController.upgradeToSuperAdmin);

// POST /api/admin/seed-templates - Seed process templates (admin or super_admin)
router.post('/seed-templates', adminController.seedTemplates);

// POST /api/admin/backup - Create database backup (super_admin only)
router.post('/backup', adminController.createBackup);

// GET /api/admin/backup/history - Get backup history (super_admin only)
router.get('/backup/history', adminController.getBackupHistory);

// GET /api/admin/backup/:id/download - Download a specific backup (super_admin only)
router.get('/backup/:id/download', adminController.downloadBackup);

// POST /api/admin/backup/:id/restore - Restore from a server-stored backup (super_admin only)
router.post('/backup/:id/restore', adminController.restoreFromServerBackup);

// DELETE /api/admin/backup/:id - Delete a backup (super_admin only)
router.delete('/backup/:id', adminController.deleteBackup);

// POST /api/admin/restore - Restore database from uploaded backup file (super_admin only)
router.post('/restore', adminController.restoreBackup);

export default router;

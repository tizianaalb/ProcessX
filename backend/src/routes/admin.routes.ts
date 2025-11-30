import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/admin/users - Get all users in the organization
router.get('/users', adminController.getUsers);

// POST /api/admin/users - Create a new user
router.post('/users', adminController.createUser);

// PATCH /api/admin/users/:userId - Update user details
router.patch('/users/:userId', adminController.updateUser);

// DELETE /api/admin/users/:userId - Delete a user
router.delete('/users/:userId', adminController.deleteUser);

// POST /api/admin/users/:userId/reset-password - Admin reset user password
router.post('/users/:userId/reset-password', adminController.resetUserPassword);

export default router;

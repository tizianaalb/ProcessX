import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { z } from 'zod';
import bcrypt from 'bcrypt';

// Validation schema for user creation
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['super_admin', 'admin', 'user']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationId: z.string().uuid().optional(), // For super_admin to assign users to orgs
});

// Validation schema for user update
const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['super_admin', 'admin', 'user']).optional(),
  organizationId: z.string().uuid().optional(), // For super_admin to move users between orgs
});

// Validation schema for password reset
const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Get all users in the organization (or all users for super_admin)
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Get user's organization and verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only administrators can manage users' });
    }

    // Super admins can see all users across all organizations
    // Regular admins can only see users in their org and cannot see super_admin accounts
    const whereClause = currentUser.role === 'super_admin'
      ? {}
      : {
          organizationId: currentUser.organizationId,
          role: { not: 'super_admin' } // Regular admins cannot see super_admin accounts
        };

    // Get users
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      users,
      isSuperAdmin: currentUser.role === 'super_admin',
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Create a new user
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Get user's organization and verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only administrators can create users' });
    }

    // Validate request body
    const validatedData = createUserSchema.parse(req.body);

    // Regular admins cannot create super_admin accounts
    if (currentUser.role === 'admin' && validatedData.role === 'super_admin') {
      return res.status(403).json({
        error: 'Only super administrators can create super_admin accounts'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Determine organization ID
    // Super admins can specify organization, regular admins use their own
    const targetOrgId = currentUser.role === 'super_admin' && validatedData.organizationId
      ? validatedData.organizationId
      : currentUser.organizationId;

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        passwordHash,
        organizationId: targetOrgId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

/**
 * Update user details
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { userId: targetUserId } = req.params;

    // Get user's organization and verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only administrators can update users' });
    }

    // Validate request body
    const validatedData = updateUserSchema.parse(req.body);

    // Check if target user exists
    // Super admins can update any user, regular admins only in their org
    const whereClause = currentUser.role === 'super_admin'
      ? { id: targetUserId }
      : { id: targetUserId, organizationId: currentUser.organizationId };

    const targetUser = await prisma.user.findFirst({
      where: whereClause,
    });

    if (!targetUser) {
      return res.status(404).json({
        error: currentUser.role === 'super_admin'
          ? 'User not found'
          : 'User not found in your organization'
      });
    }

    // Regular admins cannot edit super_admin accounts
    if (currentUser.role === 'admin' && targetUser.role === 'super_admin') {
      return res.status(403).json({
        error: 'Only super administrators can edit super_admin accounts'
      });
    }

    // Regular admins cannot promote users to super_admin
    if (currentUser.role === 'admin' && validatedData.role === 'super_admin') {
      return res.status(403).json({
        error: 'Only super administrators can promote users to super_admin'
      });
    }

    // If email is being changed, check it doesn't already exist
    if (validatedData.email && validatedData.email !== targetUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: validatedData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { userId: targetUserId } = req.params;

    // Get user's organization and verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only administrators can delete users' });
    }

    // Prevent self-deletion
    if (userId === targetUserId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Check if target user exists
    // Super admins can delete any user, regular admins only in their org
    const whereClause = currentUser.role === 'super_admin'
      ? { id: targetUserId }
      : { id: targetUserId, organizationId: currentUser.organizationId };

    const targetUser = await prisma.user.findFirst({
      where: whereClause,
    });

    if (!targetUser) {
      return res.status(404).json({
        error: currentUser.role === 'super_admin'
          ? 'User not found'
          : 'User not found in your organization'
      });
    }

    // Regular admins cannot delete super_admin accounts
    if (currentUser.role === 'admin' && targetUser.role === 'super_admin') {
      return res.status(403).json({
        error: 'Only super administrators can delete super_admin accounts'
      });
    }

    // Delete user with cascading deletion of related data
    // Use a transaction to ensure all deletions succeed or all fail
    await prisma.$transaction(async (tx) => {
      // Delete AI analyses initiated by this user
      await tx.aIAnalysis.deleteMany({
        where: { initiatedById: targetUserId },
      });

      // Delete approved recommendations by this user
      await tx.processRecommendation.updateMany({
        where: { approvedById: targetUserId },
        data: { approvedById: null },
      });

      // Delete audit logs
      await tx.auditLog.deleteMany({
        where: { userId: targetUserId },
      });

      // Delete exports
      await tx.export.deleteMany({
        where: { userId: targetUserId },
      });

      // Update pain points to remove identifier (or delete if preferred)
      // Setting identifiedById to null to preserve pain point history
      await tx.painPoint.updateMany({
        where: { identifiedById: targetUserId },
        data: { identifiedById: userId }, // Transfer to the admin doing the deletion
      });

      // Delete target processes created by this user
      await tx.targetProcess.deleteMany({
        where: { createdById: targetUserId },
      });

      // Delete processes created by this user (this will cascade to steps, connections, etc.)
      await tx.process.deleteMany({
        where: { createdById: targetUserId },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: targetUserId },
      });
    });

    res.json({
      success: true,
      message: 'User and all associated data deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

/**
 * Reset user password (admin function)
 */
export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { userId: targetUserId } = req.params;

    // Get user's organization and verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only administrators can reset passwords' });
    }

    // Validate request body
    const validatedData = resetPasswordSchema.parse(req.body);

    // Check if target user exists
    // Super admins can reset password for any user, regular admins only in their org
    const whereClause = currentUser.role === 'super_admin'
      ? { id: targetUserId }
      : { id: targetUserId, organizationId: currentUser.organizationId };

    const targetUser = await prisma.user.findFirst({
      where: whereClause,
    });

    if (!targetUser) {
      return res.status(404).json({
        error: currentUser.role === 'super_admin'
          ? 'User not found'
          : 'User not found in your organization'
      });
    }

    // Regular admins cannot reset passwords for super_admin accounts
    if (currentUser.role === 'admin' && targetUser.role === 'super_admin') {
      return res.status(403).json({
        error: 'Only super administrators can reset passwords for super_admin accounts'
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(validatedData.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash },
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Reset user password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

/**
 * Get all organizations (super_admin only)
 */
export const getOrganizations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Get user and verify super_admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super administrators can view all organizations' });
    }

    // Get all organizations with user count
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            processes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      organizations,
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
};

/**
 * Seed templates (super_admin only)
 */
export const seedTemplates = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Get user and verify super_admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super administrators can seed templates' });
    }

    // Import and run the seed script
    const { default: runSeed } = await import('../../prisma/seed-templates.js');
    await runSeed();

    res.json({
      success: true,
      message: 'Templates seeded successfully',
    });
  } catch (error) {
    console.error('Seed templates error:', error);
    res.status(500).json({ error: 'Failed to seed templates' });
  }
};

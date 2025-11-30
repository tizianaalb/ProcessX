import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { z } from 'zod';
import bcrypt from 'bcrypt';

// Validation schema for user creation
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'user']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Validation schema for user update
const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['admin', 'user']).optional(),
});

// Validation schema for password reset
const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Get all users in the organization
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

    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can manage users' });
    }

    // Get all users in the organization
    const users = await prisma.user.findMany({
      where: {
        organizationId: currentUser.organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
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

    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can create users' });
    }

    // Validate request body
    const validatedData = createUserSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

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
        organizationId: currentUser.organizationId,
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

    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can update users' });
    }

    // Validate request body
    const validatedData = updateUserSchema.parse(req.body);

    // Check if target user exists and belongs to same organization
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        organizationId: currentUser.organizationId,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found in your organization' });
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

    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can delete users' });
    }

    // Prevent self-deletion
    if (userId === targetUserId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Check if target user exists and belongs to same organization
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        organizationId: currentUser.organizationId,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found in your organization' });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: targetUserId },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
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

    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can reset passwords' });
    }

    // Validate request body
    const validatedData = resetPasswordSchema.parse(req.body);

    // Check if target user exists and belongs to same organization
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        organizationId: currentUser.organizationId,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found in your organization' });
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

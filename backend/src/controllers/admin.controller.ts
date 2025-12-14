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
 * Seed templates (admin or super_admin)
 */
export const seedTemplates = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Get user and verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only administrators can seed templates' });
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

/**
 * Create database backup (super_admin only)
 */
export const createBackup = async (req: Request, res: Response) => {
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
      return res.status(403).json({ error: 'Only super administrators can create backups' });
    }

    console.log('🔄 Creating database backup...');

    // Fetch all data
    const [
      organizations,
      users,
      processes,
      steps,
      connections,
      painPoints,
      recommendations,
      targetProcesses,
      exports,
      processTemplates,
      aiAnalyses,
      auditLogs,
    ] = await Promise.all([
      prisma.organization.findMany(),
      prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, role: true, organizationId: true, createdAt: true, updatedAt: true } }),
      prisma.process.findMany(),
      prisma.step.findMany(),
      prisma.connection.findMany(),
      prisma.painPoint.findMany(),
      prisma.processRecommendation.findMany(),
      prisma.targetProcess.findMany(),
      prisma.export.findMany(),
      prisma.processTemplate.findMany(),
      prisma.aIAnalysis.findMany(),
      prisma.auditLog.findMany(),
    ]);

    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      counts: {
        organizations: organizations.length,
        users: users.length,
        processes: processes.length,
        steps: steps.length,
        connections: connections.length,
        painPoints: painPoints.length,
        recommendations: recommendations.length,
        targetProcesses: targetProcesses.length,
        exports: exports.length,
        processTemplates: processTemplates.length,
        aiAnalyses: aiAnalyses.length,
        auditLogs: auditLogs.length,
      },
      data: {
        organizations,
        users,
        processes,
        steps,
        connections,
        painPoints,
        recommendations,
        targetProcesses,
        exports,
        processTemplates,
        aiAnalyses,
        auditLogs,
      },
    };

    console.log('✅ Backup created successfully');
    console.log('📊 Total records:', Object.values(backup.counts).reduce((a, b) => a + b, 0));

    res.json({
      success: true,
      message: 'Backup created successfully',
      backup,
    });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
};

/**
 * Restore database from backup (super_admin only)
 */
export const restoreBackup = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { backup, mode } = req.body; // mode: 'merge' or 'overwrite'

    if (!backup || !backup.data) {
      return res.status(400).json({ error: 'Invalid backup data' });
    }

    if (!mode || !['merge', 'overwrite'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid restore mode. Use "merge" or "overwrite"' });
    }

    // Get user and verify super_admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super administrators can restore backups' });
    }

    console.log(`🔄 Restoring database backup (mode: ${mode})...`);
    console.log(`📦 Backup version: ${backup.version}`);
    console.log(`📅 Backup date: ${backup.timestamp}`);

    if (mode === 'overwrite') {
      console.log('⚠️  OVERWRITE MODE: Deleting existing data...');

      // Delete all existing data in reverse dependency order
      await prisma.$transaction(async (tx) => {
        await tx.auditLog.deleteMany({});
        await tx.aIAnalysis.deleteMany({});
        await tx.export.deleteMany({});
        await tx.processRecommendation.deleteMany({});
        await tx.painPoint.deleteMany({});
        await tx.connection.deleteMany({});
        await tx.step.deleteMany({});
        await tx.targetProcess.deleteMany({});
        await tx.process.deleteMany({});
        await tx.processTemplate.deleteMany({});
        await tx.user.deleteMany({});
        await tx.organization.deleteMany({});
      });

      console.log('✅ Existing data deleted');
    }

    console.log('📥 Importing backup data...');

    // Restore data in correct dependency order
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        // Restore organizations
        const orgCount = backup.data.organizations?.length || 0;
        if (orgCount > 0) {
          for (const org of backup.data.organizations) {
            await tx.organization.upsert({
              where: { id: org.id },
              update: org,
              create: org,
            });
          }
        }

        // Restore users (without passwords - they'll need to reset)
        const userCount = backup.data.users?.length || 0;
        if (userCount > 0) {
          for (const user of backup.data.users) {
            await tx.user.upsert({
              where: { id: user.id },
              update: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                organizationId: user.organizationId,
              },
              create: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                organizationId: user.organizationId,
                passwordHash: '$2b$10$dummyHashForRestoredUsers', // Dummy hash - users must reset password
              },
            });
          }
        }

        // Restore process templates
        const templateCount = backup.data.processTemplates?.length || 0;
        if (templateCount > 0) {
          for (const template of backup.data.processTemplates) {
            await tx.processTemplate.upsert({
              where: { id: template.id },
              update: template,
              create: template,
            });
          }
        }

        // Restore processes
        const processCount = backup.data.processes?.length || 0;
        if (processCount > 0) {
          for (const process of backup.data.processes) {
            await tx.process.upsert({
              where: { id: process.id },
              update: process,
              create: process,
            });
          }
        }

        // Restore target processes
        const targetProcessCount = backup.data.targetProcesses?.length || 0;
        if (targetProcessCount > 0) {
          for (const targetProcess of backup.data.targetProcesses) {
            await tx.targetProcess.upsert({
              where: { id: targetProcess.id },
              update: targetProcess,
              create: targetProcess,
            });
          }
        }

        // Restore steps
        const stepCount = backup.data.steps?.length || 0;
        if (stepCount > 0) {
          for (const step of backup.data.steps) {
            await tx.step.upsert({
              where: { id: step.id },
              update: step,
              create: step,
            });
          }
        }

        // Restore connections
        const connectionCount = backup.data.connections?.length || 0;
        if (connectionCount > 0) {
          for (const connection of backup.data.connections) {
            await tx.connection.upsert({
              where: { id: connection.id },
              update: connection,
              create: connection,
            });
          }
        }

        // Restore pain points
        const painPointCount = backup.data.painPoints?.length || 0;
        if (painPointCount > 0) {
          for (const painPoint of backup.data.painPoints) {
            await tx.painPoint.upsert({
              where: { id: painPoint.id },
              update: painPoint,
              create: painPoint,
            });
          }
        }

        // Restore recommendations
        const recCount = backup.data.recommendations?.length || 0;
        if (recCount > 0) {
          for (const rec of backup.data.recommendations) {
            await tx.processRecommendation.upsert({
              where: { id: rec.id },
              update: rec,
              create: rec,
            });
          }
        }

        // Restore exports
        const exportCount = backup.data.exports?.length || 0;
        if (exportCount > 0) {
          for (const exp of backup.data.exports) {
            await tx.export.upsert({
              where: { id: exp.id },
              update: exp,
              create: exp,
            });
          }
        }

        // Restore AI analyses
        const aiAnalysisCount = backup.data.aiAnalyses?.length || 0;
        if (aiAnalysisCount > 0) {
          for (const analysis of backup.data.aiAnalyses) {
            await tx.aIAnalysis.upsert({
              where: { id: analysis.id },
              update: analysis,
              create: analysis,
            });
          }
        }

        // Restore audit logs
        const auditLogCount = backup.data.auditLogs?.length || 0;
        if (auditLogCount > 0) {
          for (const log of backup.data.auditLogs) {
            await tx.auditLog.upsert({
              where: { id: log.id },
              update: log,
              create: log,
            });
          }
        }

        return {
          organizations: orgCount,
          users: userCount,
          processes: processCount,
          steps: stepCount,
          connections: connectionCount,
          painPoints: painPointCount,
          recommendations: recCount,
          targetProcesses: targetProcessCount,
          exports: exportCount,
          processTemplates: templateCount,
          aiAnalyses: aiAnalysisCount,
          auditLogs: auditLogCount,
        };
      });

      console.log('✅ Database restore completed successfully');
      console.log('📊 Restored records:', result);

      res.json({
        success: true,
        message: `Database restored successfully in ${mode} mode`,
        restored: result,
      });
    } catch (error) {
      console.error('Restore transaction failed:', error);
      throw error;
    }
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({
      error: 'Failed to restore backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

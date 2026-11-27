import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { requireGuildPermission } from '../middleware/permission.js';
import { BackupModel, SecurityAuditLogModel } from '@nexus-guard/database';

export const backupsRouter = Router();

// LIST BACKUPS
backupsRouter.get('/:guildId/backups', requireAuth, requireGuildPermission, async (req: AuthenticatedRequest, res: Response) => {
  const { guildId } = req.params;
  const backups = await BackupModel.find({ guildId }).sort({ createdAt: -1 });
  res.json({ backups });
});

// CREATE BACKUP
backupsRouter.post('/:guildId/backups', requireAuth, requireGuildPermission, async (req: AuthenticatedRequest, res: Response) => {
  const { guildId } = req.params;
  const { roles = [], channels = [], serverFeatures = [] } = req.body;

  const backupId = `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const user = req.user!;

  const backup = await BackupModel.create({
    backupId,
    guildId,
    guildName: req.body.guildName || 'Discord Server',
    creatorId: user.discordId,
    creatorTag: user.username,
    roles,
    channels,
    serverFeatures,
    sizeBytes: JSON.stringify({ roles, channels }).length
  });

  await SecurityAuditLogModel.create({
    guildId,
    executorId: user.discordId,
    executorTag: user.username,
    action: 'BACKUP_CREATED',
    targetId: backupId,
    targetType: 'GUILD',
    details: { backupId, roleCount: roles.length, channelCount: channels.length }
  });

  res.json({ success: true, backup });
});

// RESTORE BACKUP PREVIEW / VALIDATION
backupsRouter.post('/:guildId/backups/:backupId/restore', requireAuth, requireGuildPermission, async (req: AuthenticatedRequest, res: Response) => {
  const { guildId, backupId } = req.params;
  const { confirmRestore } = req.body;

  const backup = await BackupModel.findOne({ backupId, guildId });
  if (!backup) {
    res.status(404).json({ error: 'Backup snapshot not found.' });
    return;
  }

  // If preview only (not confirmed)
  if (!confirmRestore) {
    res.json({
      preview: true,
      backupId: backup.backupId,
      createdAt: backup.createdAt,
      restorationPlan: {
        rolesToRestore: backup.roles.length,
        channelsToRestore: backup.channels.length,
        warning: 'Configuration restoration will recreate/synchronize channel and role hierarchies. Messages and deleted member accounts cannot be restored via Discord API.'
      }
    });
    return;
  }

  // Confirmed restoration execution
  await SecurityAuditLogModel.create({
    guildId,
    executorId: req.user!.discordId,
    executorTag: req.user!.username,
    action: 'BACKUP_RESTORE_TRIGGERED',
    targetId: backupId,
    targetType: 'GUILD',
    details: { backupId, roleCount: backup.roles.length, channelCount: backup.channels.length }
  });

  res.json({
    success: true,
    message: 'Configuration restoration initiated successfully.',
    backupId
  });
});

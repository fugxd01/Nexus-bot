import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { requireGuildPermission } from '../middleware/permission.js';
import { SecurityIncidentModel, GuildModel, SecurityAuditLogModel } from '@nexus-guard/database';
import { SecurityIncidentStatus } from '@nexus-guard/shared';

export const securityRouter = Router();

// 1. LIST INCIDENTS
securityRouter.get('/:guildId/incidents', requireAuth, requireGuildPermission, async (req: AuthenticatedRequest, res: Response) => {
  const { guildId } = req.params;
  const status = req.query.status as string;

  const query: any = { guildId };
  if (status) query.status = status;

  const incidents = await SecurityIncidentModel.find(query).sort({ createdAt: -1 }).limit(100);
  res.json({ incidents });
});

// 2. UPDATE INCIDENT STATUS (Acknowledge / Resolve)
securityRouter.patch('/:guildId/incidents/:id', requireAuth, requireGuildPermission, async (req: AuthenticatedRequest, res: Response) => {
  const { guildId, id } = req.params;
  const { status, note } = req.body;

  if (!Object.values(SecurityIncidentStatus).includes(status)) {
    res.status(400).json({ error: 'Invalid incident status.' });
    return;
  }

  const incident = await SecurityIncidentModel.findOneAndUpdate(
    { _id: id, guildId },
    {
      $set: {
        status,
        resolvedAt: status === SecurityIncidentStatus.RESOLVED ? new Date() : undefined,
        resolvedBy: req.user!.username
      }
    },
    { new: true }
  );

  if (!incident) {
    res.status(404).json({ error: 'Incident not found.' });
    return;
  }

  await SecurityAuditLogModel.create({
    guildId,
    executorId: req.user!.discordId,
    executorTag: req.user!.username,
    action: `INCIDENT_UPDATE_${status}`,
    targetId: incident._id.toString(),
    targetType: 'GUILD',
    details: { incidentId: id, newStatus: status, note }
  });

  res.json({ success: true, incident });
});

// 3. EMERGENCY LOCKDOWN TOGGLE
securityRouter.post('/:guildId/lockdown', requireAuth, requireGuildPermission, async (req: AuthenticatedRequest, res: Response) => {
  const { guildId } = req.params;
  const { action, reason } = req.body; // action: 'ACTIVATE' | 'DEACTIVATE'

  const guildDoc = await GuildModel.findOne({ guildId });
  if (!guildDoc) {
    res.status(404).json({ error: 'Guild configuration not found.' });
    return;
  }

  const isLockdown = action === 'ACTIVATE';
  await GuildModel.updateOne(
    { guildId },
    {
      $set: {
        'lockdown.isLockedDown': isLockdown,
        'lockdown.lockedAt': isLockdown ? new Date() : null,
        'lockdown.lockedBy': req.user!.username,
        'lockdown.lockdownReason': reason || (isLockdown ? 'Emergency lockdown engaged via Web Dashboard' : 'Lockdown lifted via Web Dashboard')
      }
    }
  );

  await SecurityAuditLogModel.create({
    guildId,
    executorId: req.user!.discordId,
    executorTag: req.user!.username,
    action: isLockdown ? 'EMERGENCY_LOCKDOWN_ACTIVATED' : 'EMERGENCY_LOCKDOWN_LIFTED',
    details: { reason }
  });

  res.json({
    success: true,
    isLockedDown: isLockdown,
    message: isLockdown ? 'Emergency containment activated.' : 'Lockdown deactivated.'
  });
});

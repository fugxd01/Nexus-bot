import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { requireGuildPermission } from '../middleware/permission.js';
import { ModerationCaseModel } from '@nexus-guard/database';

export const moderationRouter = Router();

// LIST MODERATION CASES
moderationRouter.get('/:guildId/cases', requireAuth, requireGuildPermission, async (req: AuthenticatedRequest, res: Response) => {
  const { guildId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

  const [cases, total] = await Promise.all([
    ModerationCaseModel.find({ guildId })
      .sort({ caseNumber: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ModerationCaseModel.countDocuments({ guildId })
  ]);

  res.json({
    cases,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

// CREATE MODERATION ACTION RECORD
moderationRouter.post('/:guildId/cases', requireAuth, requireGuildPermission, async (req: AuthenticatedRequest, res: Response) => {
  const { guildId } = req.params;
  const { action, targetId, targetTag, reason, durationSeconds } = req.body;

  const count = await ModerationCaseModel.countDocuments({ guildId });
  const newCase = await ModerationCaseModel.create({
    caseNumber: count + 1,
    guildId,
    action,
    targetId,
    targetTag,
    moderatorId: req.user!.discordId,
    moderatorTag: req.user!.username,
    reason: reason || 'Action logged from Nexus Guard Dashboard',
    durationSeconds
  });

  res.json({ success: true, case: newCase });
});

import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { requireGuildPermission } from '../middleware/permission.js';
import { 
  GuildModel, 
  SecurityIncidentModel, 
  ModerationCaseModel, 
  TicketModel 
} from '@nexus-guard/database';
import { isServerManager } from '@nexus-guard/security';
import { GuildSettingsSchema } from '@nexus-guard/shared';

export const guildsRouter = Router();

// 1. LIST GUILDS
guildsRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const manageableGuilds = (user.guilds || []).filter(g => g.owner || isServerManager(g.permissions));

  // Cross reference with DB to see where the bot is installed
  const botGuilds = await GuildModel.find({
    guildId: { $in: manageableGuilds.map(g => g.id) }
  });
  const botGuildIds = new Set(botGuilds.map(g => g.guildId));

  const result = manageableGuilds.map(g => ({
    ...g,
    hasBot: botGuildIds.has(g.id)
  }));

  res.json({ guilds: result });
});

// 2. GUILD TELEMETRY OVERVIEW
guildsRouter.get('/:guildId/overview', requireAuth, requireGuildPermission, async (req: AuthenticatedRequest, res: Response) => {
  const { guildId } = req.params;

  const [guildDoc, incidentCount, activeAlerts, caseCount, openTickets] = await Promise.all([
    GuildModel.findOne({ guildId }),
    SecurityIncidentModel.countDocuments({ guildId }),
    SecurityIncidentModel.countDocuments({ guildId, status: 'ACTIVE' }),
    ModerationCaseModel.countDocuments({ guildId }),
    TicketModel.countDocuments({ guildId, status: { $in: ['OPEN', 'CLAIMED'] } })
  ]);

  res.json({
    guild: guildDoc || { guildId, guildName: 'Server' },
    metrics: {
      totalIncidents: incidentCount,
      activeAlerts,
      totalModerationCases: caseCount,
      openTickets,
      isLockedDown: !!guildDoc?.lockdown?.isLockedDown,
      antiRaidStatus: !!guildDoc?.antiRaid?.enabled,
      antiNukeStatus: !!guildDoc?.antiNuke?.enabled,
      antiSpamStatus: !!guildDoc?.antiSpam?.enabled,
      antiBotStatus: !!guildDoc?.antiBot?.enabled
    }
  });
});

// 3. GET SETTINGS
guildsRouter.get('/:guildId/settings', requireAuth, requireGuildPermission, async (req: AuthenticatedRequest, res: Response) => {
  const { guildId } = req.params;
  const doc = await GuildModel.findOne({ guildId });
  res.json({ settings: doc });
});

// 4. UPDATE SETTINGS
guildsRouter.patch('/:guildId/settings', requireAuth, requireGuildPermission, async (req: AuthenticatedRequest, res: Response) => {
  const { guildId } = req.params;
  const updateData = req.body;

  try {
    const updated = await GuildModel.findOneAndUpdate(
      { guildId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to update guild settings.', details: err.message });
  }
});

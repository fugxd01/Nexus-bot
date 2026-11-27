import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { requireGuildPermission } from '../middleware/permission.js';
import { TicketModel } from '@nexus-guard/database';
import { TicketStatus } from '@nexus-guard/shared';

export const ticketsRouter = Router();

// LIST TICKETS
ticketsRouter.get('/:guildId/tickets', requireAuth, requireGuildPermission, async (req: AuthenticatedRequest, res: Response) => {
  const { guildId } = req.params;
  const status = req.query.status as string;

  const filter: any = { guildId };
  if (status) filter.status = status;

  const tickets = await TicketModel.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json({ tickets });
});

// CLOSE TICKET
ticketsRouter.patch('/:guildId/tickets/:ticketId/close', requireAuth, requireGuildPermission, async (req: AuthenticatedRequest, res: Response) => {
  const { guildId, ticketId } = req.params;
  const { closeReason } = req.body;

  const ticket = await TicketModel.findOneAndUpdate(
    { ticketId, guildId },
    {
      $set: {
        status: TicketStatus.CLOSED,
        closedBy: req.user!.discordId,
        closedByTag: req.user!.username,
        closeReason: closeReason || 'Closed via Web Dashboard'
      }
    },
    { new: true }
  );

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found.' });
    return;
  }

  res.json({ success: true, ticket });
});

import mongoose, { Schema, Document } from 'mongoose';
import { TicketStatus } from '@nexus-guard/shared';

export interface ITicket extends Document {
  ticketId: string;
  guildId: string;
  channelId: string;
  userId: string;
  userTag: string;
  subject: string;
  status: TicketStatus;
  claimedBy?: string;
  claimedByTag?: string;
  closedBy?: string;
  closedByTag?: string;
  closeReason?: string;
  transcriptUrl?: string;
  messages: Array<{
    authorId: string;
    authorTag: string;
    content: string;
    timestamp: Date;
    attachments: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  ticketId: { type: String, required: true, unique: true, index: true },
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userTag: { type: String, required: true },
  subject: { type: String, default: 'General Support' },
  status: { type: String, enum: Object.values(TicketStatus), default: TicketStatus.OPEN, index: true },
  claimedBy: { type: String },
  claimedByTag: { type: String },
  closedBy: { type: String },
  closedByTag: { type: String },
  closeReason: { type: String },
  transcriptUrl: { type: String },
  messages: [{
    authorId: String,
    authorTag: String,
    content: String,
    timestamp: { type: Date, default: Date.now },
    attachments: [String]
  }]
}, {
  timestamps: true
});

TicketSchema.index({ guildId: 1, userId: 1, status: 1 });

export const TicketModel = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);

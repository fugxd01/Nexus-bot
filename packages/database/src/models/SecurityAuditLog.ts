import mongoose, { Schema, Document } from 'mongoose';

export interface ISecurityAuditLog extends Document {
  guildId: string;
  executorId: string;
  executorTag: string;
  action: string;
  targetId?: string;
  targetType?: 'USER' | 'ROLE' | 'CHANNEL' | 'GUILD' | 'EMBED';
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const SecurityAuditLogSchema = new Schema<ISecurityAuditLog>({
  guildId: { type: String, required: true, index: true },
  executorId: { type: String, required: true, index: true },
  executorTag: { type: String, required: true },
  action: { type: String, required: true },
  targetId: { type: String },
  targetType: { type: String, enum: ['USER', 'ROLE', 'CHANNEL', 'GUILD', 'EMBED'] },
  details: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String },
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

SecurityAuditLogSchema.index({ guildId: 1, createdAt: -1 });

export const SecurityAuditLogModel = mongoose.models.SecurityAuditLog || mongoose.model<ISecurityAuditLog>('SecurityAuditLog', SecurityAuditLogSchema);

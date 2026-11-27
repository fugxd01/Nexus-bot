import mongoose, { Schema, Document } from 'mongoose';
import { SecurityIncidentSeverity, SecurityIncidentStatus } from '@nexus-guard/shared';

export interface ISecurityIncident extends Document {
  guildId: string;
  type: 'RAID_DETECTED' | 'NUKE_ATTEMPT' | 'SPAM_BURST' | 'UNAUTHORIZED_BOT' | 'PERMISSION_HIJACK' | 'EMERGENCY_LOCKDOWN';
  severity: SecurityIncidentSeverity;
  status: SecurityIncidentStatus;
  offenderId?: string;
  offenderTag?: string;
  title: string;
  description: string;
  evidence: Record<string, any>;
  recommendedAction: string;
  mitigationTaken?: string;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

const SecurityIncidentSchema = new Schema<ISecurityIncident>({
  guildId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['RAID_DETECTED', 'NUKE_ATTEMPT', 'SPAM_BURST', 'UNAUTHORIZED_BOT', 'PERMISSION_HIJACK', 'EMERGENCY_LOCKDOWN'],
    required: true
  },
  severity: { type: String, enum: Object.values(SecurityIncidentSeverity), required: true, index: true },
  status: { type: String, enum: Object.values(SecurityIncidentStatus), default: SecurityIncidentStatus.ACTIVE, index: true },
  offenderId: { type: String, index: true },
  offenderTag: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  evidence: { type: Schema.Types.Mixed, default: {} },
  recommendedAction: { type: String, required: true },
  mitigationTaken: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
  resolvedAt: { type: Date },
  resolvedBy: { type: String }
}, {
  timestamps: true
});

SecurityIncidentSchema.index({ guildId: 1, createdAt: -1 });

export const SecurityIncidentModel = mongoose.models.SecurityIncident || mongoose.model<ISecurityIncident>('SecurityIncident', SecurityIncidentSchema);

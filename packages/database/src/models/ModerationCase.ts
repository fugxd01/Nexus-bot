import mongoose, { Schema, Document } from 'mongoose';
import { ModerationActionType } from '@nexus-guard/shared';

export interface IModerationCase extends Document {
  caseNumber: number;
  guildId: string;
  action: ModerationActionType;
  targetId: string;
  targetTag: string;
  moderatorId: string;
  moderatorTag: string;
  reason: string;
  durationSeconds?: number;
  expiresAt?: Date;
  active: boolean;
  createdAt: Date;
}

const ModerationCaseSchema = new Schema<IModerationCase>({
  caseNumber: { type: Number, required: true },
  guildId: { type: String, required: true, index: true },
  action: { type: String, enum: Object.values(ModerationActionType), required: true },
  targetId: { type: String, required: true, index: true },
  targetTag: { type: String, required: true },
  moderatorId: { type: String, required: true },
  moderatorTag: { type: String, required: true },
  reason: { type: String, default: 'No reason provided' },
  durationSeconds: { type: Number },
  expiresAt: { type: Date },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

ModerationCaseSchema.index({ guildId: 1, caseNumber: -1 });
ModerationCaseSchema.index({ guildId: 1, targetId: 1 });

export const ModerationCaseModel = mongoose.models.ModerationCase || mongoose.model<IModerationCase>('ModerationCase', ModerationCaseSchema);

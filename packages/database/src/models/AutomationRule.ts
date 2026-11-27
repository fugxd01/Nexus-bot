import mongoose, { Schema, Document } from 'mongoose';

export interface IAutomationRule extends Document {
  guildId: string;
  name: string;
  trigger: 'MEMBER_JOIN' | 'MEMBER_LEAVE' | 'SCHEDULED_INTERVAL' | 'KEYWORD_DETECTED' | 'SECURITY_ALERT';
  enabled: boolean;
  scheduleCron?: string;
  config: Record<string, any>;
  actionType: 'SEND_ANNOUNCEMENT' | 'ASSIGN_ROLE' | 'SEND_DM' | 'LOCKDOWN_CHANNEL';
  actionPayload: Record<string, any>;
  lastRunAt?: Date;
  createdAt: Date;
}

const AutomationRuleSchema = new Schema<IAutomationRule>({
  guildId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  trigger: {
    type: String,
    enum: ['MEMBER_JOIN', 'MEMBER_LEAVE', 'SCHEDULED_INTERVAL', 'KEYWORD_DETECTED', 'SECURITY_ALERT'],
    required: true
  },
  enabled: { type: Boolean, default: true },
  scheduleCron: { type: String },
  config: { type: Schema.Types.Mixed, default: {} },
  actionType: {
    type: String,
    enum: ['SEND_ANNOUNCEMENT', 'ASSIGN_ROLE', 'SEND_DM', 'LOCKDOWN_CHANNEL'],
    required: true
  },
  actionPayload: { type: Schema.Types.Mixed, default: {} },
  lastRunAt: { type: Date }
}, {
  timestamps: true
});

export const AutomationRuleModel = mongoose.models.AutomationRule || mongoose.model<IAutomationRule>('AutomationRule', AutomationRuleSchema);

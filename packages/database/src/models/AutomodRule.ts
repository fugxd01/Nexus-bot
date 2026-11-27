import mongoose, { Schema, Document } from 'mongoose';

export interface IAutomodRule extends Document {
  guildId: string;
  name: string;
  ruleType: 'BANNED_WORDS' | 'INVITE_LINKS' | 'PHISHING_LINKS' | 'CAPS_FLOOD' | 'MENTION_LIMIT' | 'EMOJI_SPAM';
  enabled: boolean;
  matchPatterns: string[];
  exemptRoles: string[];
  exemptChannels: string[];
  action: 'DELETE_MESSAGE' | 'WARN_MEMBER' | 'TIMEOUT_MEMBER';
  timeoutDurationSeconds?: number;
  createdAt: Date;
}

const AutomodRuleSchema = new Schema<IAutomodRule>({
  guildId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  ruleType: {
    type: String,
    enum: ['BANNED_WORDS', 'INVITE_LINKS', 'PHISHING_LINKS', 'CAPS_FLOOD', 'MENTION_LIMIT', 'EMOJI_SPAM'],
    required: true
  },
  enabled: { type: Boolean, default: true },
  matchPatterns: { type: [String], default: [] },
  exemptRoles: { type: [String], default: [] },
  exemptChannels: { type: [String], default: [] },
  action: {
    type: String,
    enum: ['DELETE_MESSAGE', 'WARN_MEMBER', 'TIMEOUT_MEMBER'],
    default: 'DELETE_MESSAGE'
  },
  timeoutDurationSeconds: { type: Number, default: 300 }
}, {
  timestamps: true
});

export const AutomodRuleModel = mongoose.models.AutomodRule || mongoose.model<IAutomodRule>('AutomodRule', AutomodRuleSchema);

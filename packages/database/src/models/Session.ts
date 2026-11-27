import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  sessionId: string;
  userId: string;
  userTag: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  userTag: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Auto-expire documents
  ipAddress: { type: String },
  userAgent: { type: String }
}, {
  timestamps: true
});

export const SessionModel = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

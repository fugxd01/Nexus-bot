import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  discordId: string;
  username: string;
  discriminator: string;
  avatar?: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  guilds?: Array<{
    id: string;
    name: string;
    icon?: string;
    owner: boolean;
    permissions: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  discordId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  discriminator: { type: String, default: '0' },
  avatar: { type: String },
  email: { type: String },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiresAt: { type: Date },
  guilds: [{
    id: String,
    name: String,
    icon: String,
    owner: Boolean,
    permissions: String
  }]
}, {
  timestamps: true
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

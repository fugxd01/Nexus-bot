import mongoose, { Schema, Document } from 'mongoose';

export interface IBackupRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  mentionable: boolean;
}

export interface IBackupChannel {
  id: string;
  name: string;
  type: number;
  position: number;
  parentId?: string | null;
  topic?: string | null;
  nsfw: boolean;
  rateLimitPerUser: number;
  permissionOverwrites: Array<{
    id: string;
    type: number;
    allow: string;
    deny: string;
  }>;
}

export interface IBackup extends Document {
  backupId: string;
  guildId: string;
  guildName: string;
  creatorId: string;
  creatorTag: string;
  roles: IBackupRole[];
  channels: IBackupChannel[];
  serverFeatures: string[];
  sizeBytes: number;
  createdAt: Date;
}

const BackupSchema = new Schema<IBackup>({
  backupId: { type: String, required: true, unique: true, index: true },
  guildId: { type: String, required: true, index: true },
  guildName: { type: String, required: true },
  creatorId: { type: String, required: true },
  creatorTag: { type: String, required: true },
  roles: [{
    id: String,
    name: String,
    color: Number,
    hoist: Boolean,
    position: Number,
    permissions: String,
    mentionable: Boolean
  }],
  channels: [{
    id: String,
    name: String,
    type: Number,
    position: Number,
    parentId: String,
    topic: String,
    nsfw: Boolean,
    rateLimitPerUser: Number,
    permissionOverwrites: [{
      id: String,
      type: Number,
      allow: String,
      deny: String
    }]
  }],
  serverFeatures: [String],
  sizeBytes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

export const BackupModel = mongoose.models.Backup || mongoose.model<IBackup>('Backup', BackupSchema);

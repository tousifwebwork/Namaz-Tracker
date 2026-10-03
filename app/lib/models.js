import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    minlength: 3, 
    maxlength: 30 },
    passwordHash: { type: String, required: true, select: false },
    dob: { type: Date, default: null },
}, 
{ timestamps: true }
);



const prayerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  date: { type: String, required: true },
  fajr: { type: Boolean, default: false },
  dhuhr: { type: Boolean, default: false },
  asr: { type: Boolean, default: false },
  maghrib: { type: Boolean, default: false },
  isha: { type: Boolean, default: false },
}, { timestamps: true });
prayerSchema.index({ userId: 1, date: 1 }, { unique: true });



export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Prayer = mongoose.models.Prayer || mongoose.model('Prayer', prayerSchema);

import React, { useState, useRef } from 'react';
import { AmbassadorProfile } from '../types';
import { X, User, Lock, Award, LogOut, Check, Camera, Shield, Mail, AtSign, Eye, EyeOff, Sparkles, Plus } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AmbassadorProfile;
  onUpdateProfile: (updates: Partial<AmbassadorProfile>) => Promise<void>;
  onChangePassword: (curr: string, next: string) => Promise<{ success: boolean; message: string }>;
  onSignOut: () => void;
  seededBrandsCount: number;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onChangePassword,
  onSignOut,
  seededBrandsCount,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'tier'>('profile');

  // Profile Form state
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email || '');
  const [handle, setHandle] = useState(profile.handle || '');
  const [bio, setBio] = useState(profile.bio || 'Fashion & Streetwear Ambassador | Stockholm & NYC');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  React.useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setEmail(profile.email || '');
      setHandle(profile.handle || '');
      setBio(profile.bio || 'Fashion & Streetwear Ambassador | Stockholm & NYC');
      setAvatarUrl(profile.avatar_url);
    }
  }, [isOpen, profile]);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Security Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Sign out confirmation
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [localTryonImage, setLocalTryonImage] = useState(profile.tryon_base_image);

  const [avatars, setAvatars] = useState<any[]>([]);
  const [newAvatarName, setNewAvatarName] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      import('../services/api').then(({ apiService }) => {
        apiService.getTryonAvatars().then(setAvatars);
      });
    }
  }, [isOpen]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && newAvatarName.trim()) {
      setIsUploadingAvatar(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_HEIGHT = 1024;
            const scaleSize = MAX_HEIGHT / img.height;
            canvas.width = img.width * scaleSize;
            canvas.height = MAX_HEIGHT;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            
            const { apiService } = await import('../services/api');
            const newAv = await apiService.createTryonAvatar(newAvatarName.trim(), base64);
            setAvatars([...avatars, newAv]);
            setNewAvatarName('');
          } catch(e) {
            alert("Error saving avatar.");
          } finally {
            setIsUploadingAvatar(false);
          }
        };
        img.onerror = () => {
           alert("Invalid image format!");
           setIsUploadingAvatar(false);
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => setIsUploadingAvatar(false);
      reader.readAsDataURL(file);
    } else {
        alert("Please enter a scenario name before selecting an image.");
    }
  };

  const handleDeleteAvatar = async (id: string) => {
    if (!confirm("Delete this avatar?")) return;
    try {
      const { apiService } = await import('../services/api');
      await apiService.deleteTryonAvatar(id);
      setAvatars(avatars.filter(a => a.id !== id));
    } catch {
      alert("Failed to delete avatar");
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tryOnFileInputRef = useRef<HTMLInputElement>(null);


  if (!isOpen) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (typeof evt.target?.result === 'string') {
          setAvatarUrl(evt.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_HEIGHT = 1024;
            const scaleSize = MAX_HEIGHT / img.height;
            canvas.width = img.width * scaleSize;
            canvas.height = MAX_HEIGHT;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            
            setLocalTryonImage(base64);
            const { apiService } = await import('../services/api');
            const ok = await apiService.updateTryOnImage(base64);
            if (ok) {
              onUpdateProfile({ ...profile, tryon_base_image: base64 });
            } else {
              alert("Failed to save avatar.");
            }
          } catch(e) {
            alert("Error processing image.");
          } finally {
            setIsUploadingImage(false);
          }
        };
        img.onerror = () => {
           alert("Invalid image format! Please use JPG or PNG.");
           setIsUploadingImage(false);
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => setIsUploadingImage(false);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(false);
    try {
      await onUpdateProfile({
        name: name.trim(),
        email: email.trim(),
        handle: handle.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await onChangePassword(currentPassword, newPassword);
      if (res.success) {
        setPwdSuccess('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPwdSuccess(null), 3000);
      } else {
        setPwdError(res.message);
      }
    } catch {
      setPwdError('Failed to change password. Please check your current password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight font-['Syne',sans-serif]">
                Manage Account
              </h2>
              <p className="text-xs text-neutral-500">Profile, security, and ambassador credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-neutral-100 px-5 sm:px-6 bg-[#FAF9F6] text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Details</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('tier')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tier'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Ambassador Tier</span>
          </button>


        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 flex-1 space-y-6">
          {/* TAB 1: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileSuccess && (
                <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Account profile updated successfully.</span>
                </div>
              )}

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Profile Photo / Avatar
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-neutral-900 shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-neutral-200 border-2 border-neutral-300 flex items-center justify-center text-neutral-500 shadow-sm">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Upload new avatar"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg, image/png, image/webp, image/jpg"
                      className="hidden"
                      onChange={handleAvatarFile}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md transition-colors cursor-pointer"
                    >
                      Change Photo
                    </button>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      JPG, PNG or GIF. Recommended 400x400.
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>

              {/* Email & Handle Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@agency.com"
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Social Handle
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="@handle"
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Ambassador Bio / Agency Notes
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Fashion niche, location, represented brands..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 resize-none"
                />
              </div>


              {/* AI Try-On Avatars */}
              <div className="pt-4 border-t border-neutral-100">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  AI Try-On Avatars (Scenarios)
                </label>
                <p className="text-[11px] text-neutral-500 mb-3">Upload multiple full-body photos of yourself for different scenarios (e.g. Streetwear, Red Carpet). The Surprise Me system can use these to generate custom looks.</p>
                
                <div className="flex flex-wrap gap-4 mb-4">
                  {avatars.map(av => (
                    <div key={av.id} className="w-24 relative group">
                      <div className="w-24 h-32 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 relative">
                        <img src={av.image_base64} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); handleDeleteAvatar(av.id); }}
                          className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded hover:bg-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[10px] font-semibold text-center mt-1 truncate w-full text-neutral-700">{av.name}</p>
                    </div>
                  ))}
                  
                  {/* Add New Avatar */}
                  <div className="w-24 flex flex-col gap-2">
                    <input 
                      type="text" 
                      placeholder="Scenario name..." 
                      value={newAvatarName}
                      onChange={e => setNewAvatarName(e.target.value)}
                      className="w-full px-2 py-1 text-[10px] border border-neutral-200 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newAvatarName.trim()) { alert("Enter a scenario name first!"); return; }
                        avatarInputRef.current?.click();
                      }}
                      disabled={isUploadingAvatar}
                      className="w-full h-32 bg-neutral-50 hover:bg-neutral-100 border border-dashed border-neutral-300 flex flex-col items-center justify-center rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-5 h-5 text-neutral-400 mb-1" />
                      <span className="text-[10px] font-medium text-neutral-500">
                        {isUploadingAvatar ? 'Uploading...' : 'Add Avatar'}
                      </span>
                    </button>
                    <input ref={avatarInputRef} type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleAvatarUpload} />
                  </div>
                </div>
              </div>

              {/* Submit Profile */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 active:scale-[0.98] rounded-lg min-h-[40px] shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PASSWORD & SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              {pwdError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
                  {pwdError}
                </div>
              )}
              {pwdSuccess && (
                <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2 pr-10 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  New Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPassword || !newPassword}
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 active:scale-[0.98] rounded-lg min-h-[40px] shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSavingPassword ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: AMBASSADOR TIER */}
          {activeTab === 'tier' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" /> {profile.tier || 'VIP Partner Ambassador'}
                  </span>
                  <span className="text-[11px] text-neutral-300">
                    Active since {profile.member_since || 'March 2025'}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-['Syne',sans-serif]">{profile.name}</h3>
                <p className="text-xs text-neutral-300 mt-1">{profile.bio}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#FAF9F6] rounded-lg border border-neutral-200">
                  <span className="text-[11px] text-neutral-400 font-semibold uppercase block">Seeded Brands</span>
                  <span className="text-xl font-bold text-neutral-900 mt-0.5 block tabular-nums">{seededBrandsCount}</span>
                  <span className="text-[10px] text-neutral-500">Active PR seeding roster</span>
                </div>

                <div className="p-3 bg-[#FAF9F6] rounded-lg border border-neutral-200">
                  <span className="text-[11px] text-neutral-400 font-semibold uppercase block">Fulfillment Rate</span>
                  <span className="text-xl font-bold text-emerald-700 mt-0.5 block tabular-nums">100%</span>
                  <span className="text-[10px] text-neutral-500">Post & reel deliverables met</span>
                </div>
              </div>
            </div>
          )}



          {/* SIGN OUT SECTION */}
          <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-neutral-500">
              Signed in as <strong className="text-neutral-900">{profile.email}</strong>
            </div>

            {confirmSignOut ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-700 font-semibold">Sign out now?</span>
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-md font-semibold cursor-pointer"
                >
                  Yes, Sign Out
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmSignOut(false)}
                  className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmSignOut(true)}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-rose-600 font-medium cursor-pointer transition-colors p-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

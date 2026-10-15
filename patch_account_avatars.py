import re

with open('src/components/AccountModal.tsx', 'r') as f:
    content = f.read()

# Add Avatar states
avatar_states = """
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
"""

content = content.replace("const [localTryonImage, setLocalTryonImage] = useState(profile.tryon_base_image);", "const [localTryonImage, setLocalTryonImage] = useState(profile.tryon_base_image);\n" + avatar_states)

# Replace the AI Try-On Avatar UI
old_ui = """{/* AI Try-On Avatar */}
              <div className="pt-4 border-t border-neutral-100">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  AI Try-On Avatar (Full Body)
                </label>
                <p className="text-[11px] text-neutral-500 mb-3">Upload a full-body photo of yourself to be used for automatic AI outfit suggestions. Needs a clean background and full body visible.</p>
                <div className="flex items-start gap-4">
                  <div 
                    className="w-24 h-32 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 shrink-0 relative group cursor-pointer"
                    onClick={(e) => {
                      tryOnFileInputRef.current?.click();
                    }}
                  >
                    {localTryonImage ? (
                      <img src={localTryonImage} alt="Try On Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs text-center p-2">No Photo</div>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white mb-1" />
                      <span className="text-[10px] text-white font-semibold uppercase">Change</span>
                    </div>
                    <input ref={tryOnFileInputRef} type="file" className="hidden" accept="image/jpeg, image/png, image/webp, image/jpg" onChange={handleImageUpload} />
                  </div>
                </div>
              </div>"""

new_ui = """{/* AI Try-On Avatars */}
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
              </div>"""

if old_ui in content:
    content = content.replace(old_ui, new_ui)
    
with open('src/components/AccountModal.tsx', 'w') as f:
    f.write(content)

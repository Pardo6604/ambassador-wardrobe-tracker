import re
with open('src/components/AccountModal.tsx', 'r') as f:
    content = f.read()

# Add useRef to imports if not there
if "useRef" not in content:
    content = content.replace("import React, { useState }", "import React, { useState, useRef }")

# Add local state and ref
state_code = """  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [localTryonImage, setLocalTryonImage] = useState(profile.tryon_base_image);
  const fileInputRef = useRef<HTMLInputElement>(null);"""
content = re.sub(r"  const \[confirmSignOut, setConfirmSignOut\] = useState\(false\);\n  const \[isUploadingImage, setIsUploadingImage\] = useState\(false\);", state_code, content)

# Add handler function
handler_code = """  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setLocalTryonImage(base64);
        try {
          const { apiService } = await import('../services/api');
          await apiService.updateTryOnImage(base64);
          onUpdateProfile({ ...profile, tryon_base_image: base64 });
        } catch(e) {
          console.error(e);
        }
      };
      reader.readAsDataURL(file);
    }
  };"""

content = content.replace("  const handleSaveProfile", handler_code + "\n\n  const handleSaveProfile")

# Replace UI block
old_ui = """              {/* AI Try-On Avatar */}
              <div className="pt-4 border-t border-neutral-100">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  AI Try-On Avatar (Full Body)
                </label>
                <p className="text-[11px] text-neutral-500 mb-3">Upload a full-body photo of yourself to be used for automatic AI outfit suggestions. Needs a clean background and full body visible.</p>
                <div className="flex items-start gap-4">
                  <div 
                    className="w-24 h-32 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 shrink-0 relative group cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName !== 'INPUT') {
                        document.getElementById('tryon_upload')?.click();
                      }
                    }}
                  >
                    {profile.tryon_base_image ? (
                      <img src={profile.tryon_base_image} alt="Try On Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs text-center p-2">No Photo</div>
                    )}
                    <label htmlFor="tryon_upload" className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      {isUploadingImage ? (
                        <span className="text-[10px] text-white font-semibold uppercase">Uploading...</span>
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-white mb-1" />
                          <span className="text-[10px] text-white font-semibold uppercase">Change</span>
                        </>
                      )}
                      <input id="tryon_upload" type="file" className="hidden" accept="image/jpeg, image/png, image/webp, image/jpg" onChange={async (e) => {
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
                      }} />
                    </label>
                  </div>
                </div>
              </div>"""

new_ui = """              {/* AI Try-On Avatar */}
              <div className="pt-4 border-t border-neutral-100">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  AI Try-On Avatar (Full Body)
                </label>
                <p className="text-[11px] text-neutral-500 mb-3">Upload a full-body photo of yourself to be used for automatic AI outfit suggestions. Needs a clean background and full body visible.</p>
                <div className="flex items-start gap-4">
                  <div 
                    className="w-24 h-32 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 shrink-0 relative group cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      fileInputRef.current?.click();
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
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
                </div>
              </div>"""

# Remove the regex compile block for safety, just replace
content = content.replace(old_ui, new_ui)

with open('src/components/AccountModal.tsx', 'w') as f:
    f.write(content)

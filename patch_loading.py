import re
with open('src/components/AccountModal.tsx', 'r') as f:
    content = f.read()

# Add state
state_match = "  const [confirmSignOut, setConfirmSignOut] = useState(false);"
state_repl = "  const [confirmSignOut, setConfirmSignOut] = useState(false);\n  const [isUploadingImage, setIsUploadingImage] = useState(false);"
content = content.replace(state_match, state_repl)

# Update onChange
old_onchange = """                      <input id="tryon_upload" type="file" className="hidden" accept="image/jpeg, image/png, image/webp, image/jpg" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const img = new Image();
                            img.onload = async () => {
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
                                alert("Try-On Avatar saved!");
                              } else {
                                alert("Failed to save avatar.");
                              }
                            };
                            img.src = reader.result as string;
                          };
                          reader.readAsDataURL(file);
                        }
                      }} />"""

new_onchange = """                      <input id="tryon_upload" type="file" className="hidden" accept="image/jpeg, image/png, image/webp, image/jpg" onChange={async (e) => {
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
                      }} />"""

content = content.replace(old_onchange, new_onchange)

# Update loading text overlay
old_overlay = """                    <label htmlFor="tryon_upload" className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-5 h-5 text-white mb-1" />
                      <span className="text-[10px] text-white font-semibold uppercase">Change</span>"""

new_overlay = """                    <label htmlFor="tryon_upload" className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      {isUploadingImage ? (
                        <span className="text-[10px] text-white font-semibold uppercase">Uploading...</span>
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-white mb-1" />
                          <span className="text-[10px] text-white font-semibold uppercase">Change</span>
                        </>
                      )}"""

content = content.replace(old_overlay, new_overlay)

with open('src/components/AccountModal.tsx', 'w') as f:
    f.write(content)

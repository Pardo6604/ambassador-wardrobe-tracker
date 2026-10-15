with open('src/components/AccountModal.tsx', 'r') as f:
    content = f.read()

old_onchange = """                      <input id="tryon_upload" type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const base64 = reader.result as string;
                            const { apiService } = await import('../services/api');
                            const ok = await apiService.updateTryOnImage(base64);
                            if (ok) {
                              onUpdateProfile({ ...profile, tryon_base_image: base64 });
                              alert("Try-On Avatar saved!");
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }} />"""

new_onchange = """                      <input id="tryon_upload" type="file" className="hidden" accept="image/*" onChange={async (e) => {
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

content = content.replace(old_onchange, new_onchange)

with open('src/components/AccountModal.tsx', 'w') as f:
    f.write(content)

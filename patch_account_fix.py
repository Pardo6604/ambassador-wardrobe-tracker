with open('src/components/AccountModal.tsx', 'r') as f:
    content = f.read()

new_ui = """
              {/* AI Try-On Avatar */}
              <div className="pt-4 border-t border-neutral-100">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  AI Try-On Avatar (Full Body)
                </label>
                <p className="text-[11px] text-neutral-500 mb-3">Upload a full-body photo of yourself to be used for automatic AI outfit suggestions. Needs a clean background and full body visible.</p>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-32 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 shrink-0 relative group">
                    {profile.tryon_base_image ? (
                      <img src={profile.tryon_base_image} alt="Try On Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs text-center p-2">No Photo</div>
                    )}
                    <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-5 h-5 text-white mb-1" />
                      <span className="text-[10px] text-white font-semibold uppercase">Change</span>
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
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
                      }} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Profile */}"""

content = content.replace("              {/* Submit Profile */}", new_ui)

with open('src/components/AccountModal.tsx', 'w') as f:
    f.write(content)

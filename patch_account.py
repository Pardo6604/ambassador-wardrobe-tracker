import re

with open('src/components/AccountModal.tsx', 'r') as f:
    content = f.read()

# Add a section after Password section
old_pass_section = """            <div className="pt-5 border-t border-neutral-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 text-sm font-semibold text-white bg-neutral-900 hover:bg-black rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>"""

new_tryon_section = """            
            <div className="pt-5 border-t border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900 mb-2 font-['Syne',sans-serif]">AI Try-On Avatar</h3>
              <p className="text-xs text-neutral-500 mb-4">Upload a full-body photo of yourself to be used for automatic AI outfit suggestions. Needs a clean background and full body visible.</p>
              
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
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const base64 = reader.result as string;
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

            <div className="pt-5 border-t border-neutral-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 text-sm font-semibold text-white bg-neutral-900 hover:bg-black rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>"""

content = content.replace(old_pass_section, new_tryon_section)

with open('src/components/AccountModal.tsx', 'w') as f:
    f.write(content)

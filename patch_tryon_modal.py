import re

with open('src/components/TryOnModal.tsx', 'r') as f:
    content = f.read()

avatar_logic = """  const [avatars, setAvatars] = useState<any[]>([]);
  React.useEffect(() => {
    apiService.getTryonAvatars().then(setAvatars);
  }, []);
"""

content = content.replace("const [personImage, setPersonImage] = useState<string | null>(null);", "const [personImage, setPersonImage] = useState<string | null>(null);\n" + avatar_logic)

old_ui = """              {/* Person Image Upload */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  1. Your Full-Body Photo
                </label>
                <div 
                  className={`border-2 border-dashed rounded-xl aspect-[3/4] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors ${personImage ? 'border-indigo-500' : 'border-neutral-200 hover:border-neutral-300'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {personImage ? (
                    <img src={personImage} alt="You" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-sm text-neutral-500">Click to upload photo</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                </div>
              </div>"""

new_ui = """              {/* Person Image Selection */}
              <div className="space-y-3 flex flex-col">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  1. Select Your Avatar
                </label>
                <div className="flex-1 border border-neutral-200 rounded-xl p-3 overflow-y-auto max-h-[400px]">
                  {avatars.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-8">No avatars found. Go to Account Settings to upload one.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {avatars.map(av => (
                        <div 
                          key={av.id} 
                          onClick={() => setPersonImage(av.image_base64)}
                          className={`cursor-pointer rounded-lg border-2 p-1 transition-all ${personImage === av.image_base64 ? 'border-indigo-500 bg-indigo-50' : 'border-transparent hover:bg-neutral-50'}`}
                        >
                          <img src={av.image_base64} alt={av.name} className="w-full aspect-[3/4] object-cover rounded-md bg-neutral-100" />
                          <p className="text-[10px] text-center mt-1 font-semibold truncate text-neutral-600">{av.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>"""

content = content.replace(old_ui, new_ui)

with open('src/components/TryOnModal.tsx', 'w') as f:
    f.write(content)

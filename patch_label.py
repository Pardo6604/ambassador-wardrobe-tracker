import re
with open('src/components/AccountModal.tsx', 'r') as f:
    content = f.read()

old_label = """                    <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-5 h-5 text-white mb-1" />
                      <span className="text-[10px] text-white font-semibold uppercase">Change</span>
                      <input type="file" className="hidden" accept="image/*" onChange="""

new_label = """                    <label htmlFor="tryon_upload" className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-5 h-5 text-white mb-1" />
                      <span className="text-[10px] text-white font-semibold uppercase">Change</span>
                      <input id="tryon_upload" type="file" className="hidden" accept="image/*" onChange="""

content = content.replace(old_label, new_label)

with open('src/components/AccountModal.tsx', 'w') as f:
    f.write(content)

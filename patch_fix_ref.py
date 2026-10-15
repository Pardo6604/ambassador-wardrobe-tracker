with open('src/components/AccountModal.tsx', 'r') as f:
    content = f.read()

# Add a second ref
content = content.replace("  const fileInputRef = useRef<HTMLInputElement>(null);", "  const fileInputRef = useRef<HTMLInputElement>(null);\n  const tryOnFileInputRef = useRef<HTMLInputElement>(null);")

# Update the TryOn section to use the second ref
old_tryon_ui = """                    onClick={(e) => {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }}"""
new_tryon_ui = """                    onClick={(e) => {
                      tryOnFileInputRef.current?.click();
                    }}"""
content = content.replace(old_tryon_ui, new_tryon_ui)

old_tryon_input = """<input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />"""
new_tryon_input = """<input ref={tryOnFileInputRef} type="file" className="hidden" accept="image/jpeg, image/png, image/webp, image/jpg" onChange={handleImageUpload} />"""
content = content.replace(old_tryon_input, new_tryon_input)

with open('src/components/AccountModal.tsx', 'w') as f:
    f.write(content)

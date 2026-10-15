with open('src/components/AccountModal.tsx', 'r') as f:
    content = f.read()

old_div = """                <div className="flex items-start gap-4">
                  <div className="w-24 h-32 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 shrink-0 relative group">"""

new_div = """                <div className="flex items-start gap-4">
                  <div 
                    className="w-24 h-32 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 shrink-0 relative group cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName !== 'INPUT') {
                        document.getElementById('tryon_upload')?.click();
                      }
                    }}
                  >"""

content = content.replace(old_div, new_div)

with open('src/components/AccountModal.tsx', 'w') as f:
    f.write(content)

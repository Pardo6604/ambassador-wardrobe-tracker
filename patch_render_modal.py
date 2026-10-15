with open('src/components/OutfitStudio.tsx', 'r') as f:
    content = f.read()

modal_code = """
      {/* AI Try-On Modal */}
      {isTryOnOpen && (
        <TryOnModal
          clothingItems={clothingItems}
          onClose={() => setIsTryOnOpen(false)}
          onSaveOutfit={onSaveOutfit}
        />
      )}

      {/* Outfit Builder Modal */}
"""

content = content.replace("      {/* Outfit Builder Modal */}", modal_code)

with open('src/components/OutfitStudio.tsx', 'w') as f:
    f.write(content)

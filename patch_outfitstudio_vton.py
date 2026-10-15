import re

with open('src/components/OutfitStudio.tsx', 'r') as f:
    content = f.read()

# 1. Import TryOnModal
content = content.replace("import { FitPicUploadModal } from './FitPicUploadModal';", "import { FitPicUploadModal } from './FitPicUploadModal';\nimport { TryOnModal } from './TryOnModal';")

# 2. Add state
state_code = """  const [selectedOccasion, setSelectedOccasion] = useState<string>('All');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [activeUploadOutfitId, setActiveUploadOutfitId] = useState<string | null>(null);"""
content = re.sub(r"  const \[selectedOccasion, setSelectedOccasion\] = useState<string>\('All'\);\n  const \[isBuilderOpen, setIsBuilderOpen\] = useState\(false\);\n  const \[activeUploadOutfitId, setActiveUploadOutfitId\] = useState<string \| null>\(null\);", state_code, content)

# 3. Replace Auto Generate button with Try On button
auto_gen_button_old = """          <button 
            onClick={handleAutoGenerateOutfit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded-md text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Auto-Generate</span>
          </button>"""

auto_gen_button_new = """          <button 
            onClick={() => setIsTryOnOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-semibold uppercase tracking-wider hover:bg-indigo-700 transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">AI Try-On</span>
          </button>"""
content = content.replace(auto_gen_button_old, auto_gen_button_new)

# 4. Mount TryOnModal at the bottom
modal_old = """      {isBuilderOpen && (
        <OutfitBuilderModal """
modal_new = """      {isTryOnOpen && (
        <TryOnModal
          clothingItems={clothingItems}
          onClose={() => setIsTryOnOpen(false)}
          onSaveOutfit={onSaveOutfit}
        />
      )}

      {isBuilderOpen && (
        <OutfitBuilderModal """
content = content.replace(modal_old, modal_new)


with open('src/components/OutfitStudio.tsx', 'w') as f:
    f.write(content)

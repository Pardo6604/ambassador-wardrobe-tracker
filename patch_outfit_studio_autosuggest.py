import re

with open('src/components/OutfitStudio.tsx', 'r') as f:
    content = f.read()

# Add import
import_stmt = "from './AutoSuggestModal';\n"
if "AutoSuggestModal" not in content:
    content = content.replace("from './OutfitDetailModal';", "from './OutfitDetailModal';\nfrom './AutoSuggestModal';")

# Replace handleAutoSuggest
old_handle = """  const handleAutoSuggest = async () => {
    if (!profile.tryon_base_image) {
      alert("Please upload a Default Try-On Avatar in your Account Settings first!");
      return;
    }
    
    setIsAutoSuggesting(true);
    try {
      const newOutfit = await apiService.autoSuggestOutfit();
      if (newOutfit) {
        if (onOutfitGenerated) {
          onOutfitGenerated(newOutfit);
        }
      }
    } catch (e: any) {
      alert(e.message || "Failed to auto-suggest outfit.");
    } finally {
      setIsAutoSuggesting(false);
    }
  };"""

new_handle = """  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  const handleAutoSuggest = async (avatarId?: string) => {
    setIsAutoSuggesting(true);
    setIsSuggestModalOpen(false);
    try {
      const newOutfit = await apiService.autoSuggestOutfit(avatarId);
      if (newOutfit) {
        if (onOutfitGenerated) {
          onOutfitGenerated(newOutfit);
        }
      }
    } catch (e: any) {
      alert(e.message || "Failed to auto-suggest outfit.");
    } finally {
      setIsAutoSuggesting(false);
    }
  };"""

if old_handle in content:
    content = content.replace(old_handle, new_handle)
    
# Change button onClick
old_button = """          <button
            onClick={handleAutoSuggest}
            disabled={isAutoSuggesting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-900 bg-amber-300 hover:bg-amber-400 shadow-sm rounded-lg transition-all cursor-pointer min-h-[38px] disabled:opacity-50"
            title="Auto-suggest a look using your Default Avatar"
          >"""
          
new_button = """          <button
            onClick={() => setIsSuggestModalOpen(true)}
            disabled={isAutoSuggesting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-900 bg-amber-300 hover:bg-amber-400 shadow-sm rounded-lg transition-all cursor-pointer min-h-[38px] disabled:opacity-50"
            title="Auto-suggest a look using your Avatars"
          >"""
          
if old_button in content:
    content = content.replace(old_button, new_button)
    
# Add AutoSuggestModal at the end of the return statement
modal_comp = """      {/* Auto Suggest Modal */}
      <AutoSuggestModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        onGenerate={handleAutoSuggest}
        isGenerating={isAutoSuggesting}
      />"""

content = content.replace("{/* AI Try-On Modal */}", modal_comp + "\n\n      {/* AI Try-On Modal */}")

with open('src/components/OutfitStudio.tsx', 'w') as f:
    f.write(content)

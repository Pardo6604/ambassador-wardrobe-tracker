import re

with open('src/components/OutfitStudio.tsx', 'r') as f:
    content = f.read()

# Add a state for loading
state_code = """  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [isAutoSuggesting, setIsAutoSuggesting] = useState(false);"""
content = re.sub(r"  const \[isTryOnOpen, setIsTryOnOpen\] = useState\(false\);", state_code, content)

# Add function to handle auto suggest
auto_func = """
  const handleAutoSuggest = async () => {
    if (!profile.tryon_base_image) {
      alert("Please upload a Default Try-On Avatar in your Account Settings first!");
      return;
    }
    
    setIsAutoSuggesting(true);
    try {
      const newOutfit = await apiService.autoSuggestOutfit();
      if (newOutfit) {
        // Just reload the page or we can't easily push to state without passing a setter
        window.location.reload();
      }
    } catch (e: any) {
      alert(e.message || "Failed to auto-suggest outfit.");
    } finally {
      setIsAutoSuggesting(false);
    }
  };
"""

# Insert before return
content = content.replace("  return (", auto_func + "\n  return (")

# Add the button
buttons_code = """        {/* Creator Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleAutoSuggest}
            disabled={isAutoSuggesting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-900 bg-amber-300 hover:bg-amber-400 shadow-sm rounded-lg transition-all cursor-pointer min-h-[38px] disabled:opacity-50"
            title="Auto-suggest a look using your Default Avatar"
          >
            {isAutoSuggesting ? (
              <div className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-neutral-900" />
            )}
            <span className="hidden sm:inline">{isAutoSuggesting ? 'Creating...' : 'Surprise Me'}</span>
          </button>

          <button
            onClick={() => setIsTryOnOpen(true)}"""

content = re.sub(r"        {\/\* Creator Controls \*\/}\n        <div className=\"flex items-center gap-2\.5\">\n          <button\n            onClick=\{\(\) => setIsTryOnOpen\(true\)\}", buttons_code, content)

with open('src/components/OutfitStudio.tsx', 'w') as f:
    f.write(content)

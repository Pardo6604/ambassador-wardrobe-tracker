import re

with open('src/components/TryOnModal.tsx', 'r') as f:
    content = f.read()

# Replace selectedGarmentId with selectedGarmentIds
content = content.replace("const [selectedGarmentId, setSelectedGarmentId] = useState<string>('');", "const [selectedGarmentIds, setSelectedGarmentIds] = useState<string[]>([]);")

# Replace handleGenerate
old_handle = """  const handleGenerate = async () => {
    if (!personImage || !selectedGarmentId) return;
    
    setLoading(true);
    const garment = clothingItems.find(i => i.id === selectedGarmentId);
    
    if (garment) {
      const description = `${garment.category.toLowerCase()}: ${garment.brand}`;
      const result = await apiService.generateTryOn(personImage, garment.image_url, description);
      if (result) {
        setResultImage(result);
      } else {
        alert("Failed to generate image. Please check the backend logs.");
      }
    }
    setLoading(false);
  };"""

new_handle = """  const handleGenerate = async () => {
    if (!personImage || selectedGarmentIds.length === 0) return;
    
    setLoading(true);
    let currentImage = personImage;
    
    // Sort so tops go before bottoms
    const garmentsToApply = selectedGarmentIds.map(id => clothingItems.find(i => i.id === id)).filter(Boolean) as ClothingItem[];
    garmentsToApply.sort((a, b) => {
        if (a.category === 'Tops' || a.category === 'Dresses') return -1;
        if (b.category === 'Tops' || b.category === 'Dresses') return 1;
        return 0;
    });

    for (const garment of garmentsToApply) {
        const description = garment.category === 'Bottoms' ? 'lower_body' : garment.category === 'Dresses' ? 'dresses' : 'upper_body';
        const result = await apiService.generateTryOn(currentImage, garment.image_url, description);
        if (result) {
            currentImage = result;
        } else {
            alert(`Failed to generate image for ${garment.brand}. Please check logs.`);
            setLoading(false);
            return;
        }
    }
    
    setResultImage(currentImage);
    setLoading(false);
  };"""
content = content.replace(old_handle, new_handle)

# Replace handleSave
old_save = """  const handleSave = async () => {
    if (!resultImage || !selectedGarmentId) return;
    const garment = clothingItems.find(i => i.id === selectedGarmentId);
    
    await onSaveOutfit({
      title: `AI Try-On: ${garment?.brand || 'New'} Look`,
      occasion: 'Virtual Try-On',
      model_image_url: resultImage,
      item_ids: [selectedGarmentId],
      styling_notes: 'Generated using Hugging Face IDM-VTON.'
    });
    onClose();
  };"""

new_save = """  const handleSave = async () => {
    if (!resultImage || selectedGarmentIds.length === 0) return;
    
    const brands = selectedGarmentIds.map(id => clothingItems.find(i => i.id === id)?.brand).filter(Boolean);
    const uniqueBrands = Array.from(new Set(brands));
    
    await onSaveOutfit({
      title: `AI Try-On: ${uniqueBrands.join(' + ') || 'New'} Look`,
      occasion: 'Virtual Try-On',
      model_image_url: resultImage,
      item_ids: selectedGarmentIds,
      styling_notes: 'Generated using Hugging Face IDM-VTON.'
    });
    onClose();
  };"""
content = content.replace(old_save, new_save)

# Replace disabled condition
content = content.replace("disabled={!personImage || !selectedGarmentId || loading}", "disabled={!personImage || selectedGarmentIds.length === 0 || loading}")

# Replace Selection logic
old_select = """              {/* Garment Selection */}
              <div className="space-y-3 flex flex-col">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  2. Select Garment
                </label>
                <div className="flex-1 border border-neutral-200 rounded-xl p-3 overflow-y-auto max-h-[400px]">
                  {clothingItems.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-8">Your closet is empty.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {clothingItems.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedGarmentId(item.id)}
                          className={`cursor-pointer rounded-lg border-2 p-1 transition-all ${selectedGarmentId === item.id ? 'border-indigo-500 bg-indigo-50' : 'border-transparent hover:bg-neutral-50'}`}
                        >
                          <img src={item.image_url} alt={item.brand} className="w-full aspect-square object-cover rounded-md bg-neutral-100" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>"""

new_select = """              {/* Garment Selection */}
              <div className="space-y-3 flex flex-col">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  2. Select Garments (Max 1 per category)
                </label>
                <div className="flex-1 border border-neutral-200 rounded-xl p-3 overflow-y-auto max-h-[400px]">
                  {clothingItems.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-8">Your closet is empty.</p>
                  ) : (
                    <div className="space-y-4">
                      {Array.from(new Set(clothingItems.map(i => i.category))).map(cat => {
                          const itemsInCat = clothingItems.filter(i => i.category === cat);
                          return (
                              <div key={cat}>
                                  <h4 className="text-xs font-bold text-neutral-500 mb-2 uppercase">{cat}</h4>
                                  <div className="grid grid-cols-3 gap-2">
                                    {itemsInCat.map(item => {
                                        const isSelected = selectedGarmentIds.includes(item.id);
                                        return (
                                        <div 
                                          key={item.id} 
                                          onClick={() => {
                                              if (isSelected) {
                                                  setSelectedGarmentIds(selectedGarmentIds.filter(id => id !== item.id));
                                              } else {
                                                  // Remove other items in same category, then add this one
                                                  const othersInCat = itemsInCat.map(i => i.id);
                                                  const filtered = selectedGarmentIds.filter(id => !othersInCat.includes(id));
                                                  setSelectedGarmentIds([...filtered, item.id]);
                                              }
                                          }}
                                          className={`cursor-pointer rounded-lg border-2 p-1 transition-all relative ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-transparent hover:bg-neutral-50'}`}
                                        >
                                          {isSelected && (
                                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white z-10">
                                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                              </div>
                                          )}
                                          <img src={item.image_url} alt={item.brand} className="w-full aspect-square object-cover rounded-md bg-neutral-100" />
                                        </div>
                                        );
                                    })}
                                  </div>
                              </div>
                          );
                      })}
                    </div>
                  )}
                </div>
              </div>"""

content = content.replace(old_select, new_select)

with open('src/components/TryOnModal.tsx', 'w') as f:
    f.write(content)

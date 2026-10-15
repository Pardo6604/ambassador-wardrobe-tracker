import re

with open('src/components/TryOnModal.tsx', 'r') as f:
    content = f.read()

# Replace hardcoded tops/dresses sort logic
old_sort = """    garmentsToApply.sort((a, b) => {
        if (a.category === 'Tops' || a.category === 'Dresses') return -1;
        if (b.category === 'Tops' || b.category === 'Dresses') return 1;
        return 0;
    });"""

new_sort = """    const isTopOrDress = (cat: string) => !['bottom', 'pant', 'jean', 'short', 'skirt', 'trouser', 'legging', 'shoe', 'foot', 'sneaker', 'boot'].some(w => cat.toLowerCase().includes(w));
    garmentsToApply.sort((a, b) => {
        const aIsTop = isTopOrDress(a.category);
        const bIsTop = isTopOrDress(b.category);
        if (aIsTop && !bIsTop) return -1;
        if (!aIsTop && bIsTop) return 1;
        return 0;
    });"""

content = content.replace(old_sort, new_sort)

# Replace garment description logic
old_desc = "        const description = garment.category === 'Bottoms' ? 'lower_body' : garment.category === 'Dresses' ? 'dresses' : 'upper_body';"

new_desc = """        const catLower = garment.category.toLowerCase();
        let description = 'upper_body';
        if (['bottom', 'pant', 'jean', 'short', 'skirt', 'trouser', 'legging'].some(w => catLower.includes(w))) {
            description = 'lower_body';
        } else if (['dress', 'gown', 'jumpsuit', 'romper'].some(w => catLower.includes(w))) {
            description = 'dresses';
        }"""

content = content.replace(old_desc, new_desc)

with open('src/components/TryOnModal.tsx', 'w') as f:
    f.write(content)

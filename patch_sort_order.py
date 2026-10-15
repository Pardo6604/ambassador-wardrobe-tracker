import re

with open('src/components/TryOnModal.tsx', 'r') as f:
    content = f.read()

# Change sort order: Bottoms first, Tops second
old_sort = """    const isTopOrDress = (cat: string) => !['bottom', 'pant', 'jean', 'short', 'skirt', 'trouser', 'legging', 'shoe', 'foot', 'sneaker', 'boot'].some(w => cat.toLowerCase().includes(w));
    garmentsToApply.sort((a, b) => {
        const aIsTop = isTopOrDress(a.category);
        const bIsTop = isTopOrDress(b.category);
        if (aIsTop && !bIsTop) return -1;
        if (!aIsTop && bIsTop) return 1;
        return 0;
    });"""

new_sort = """    const isTopOrDress = (cat: string) => !['bottom', 'pant', 'jean', 'short', 'skirt', 'trouser', 'legging', 'shoe', 'foot', 'sneaker', 'boot'].some(w => cat.toLowerCase().includes(w));
    // Sort so Bottoms go BEFORE Tops. This allows Tops to naturally drape over Bottoms.
    garmentsToApply.sort((a, b) => {
        const aIsTop = isTopOrDress(a.category);
        const bIsTop = isTopOrDress(b.category);
        if (!aIsTop && bIsTop) return -1;
        if (aIsTop && !bIsTop) return 1;
        return 0;
    });"""

content = content.replace(old_sort, new_sort)

with open('src/components/TryOnModal.tsx', 'w') as f:
    f.write(content)

with open('api/index.py', 'r') as f:
    content_api = f.read()

# Reverse order in backend auto_suggest_outfit
# Current: outfit_items contains top then bottom (since we append top first)
old_append = """    if tops:
        unworn_tops = [i for i in tops if i.status == "Unworn"]
        outfit_items.append(random.choice(unworn_tops) if unworn_tops else random.choice(tops))
        
    # If the first item isn't a dress, add a bottom
    if outfit_items and not any(w in outfit_items[0].category.lower() for w in ["dress", "gown", "jumpsuit", "romper"]) and bottoms:
        unworn_bottoms = [i for i in bottoms if i.status == "Unworn"]
        outfit_items.append(random.choice(unworn_bottoms) if unworn_bottoms else random.choice(bottoms))"""

new_append = """    # Add bottoms FIRST, then tops, so tops drape over bottoms during VTON
    if bottoms:
        unworn_bottoms = [i for i in bottoms if i.status == "Unworn"]
        outfit_items.append(random.choice(unworn_bottoms) if unworn_bottoms else random.choice(bottoms))

    if tops:
        unworn_tops = [i for i in tops if i.status == "Unworn"]
        outfit_items.append(random.choice(unworn_tops) if unworn_tops else random.choice(tops))
        
    # Filter out bottoms if top is a dress
    if any(w in i.category.lower() for i in outfit_items for w in ["dress", "gown", "jumpsuit", "romper"]):
        outfit_items = [i for i in outfit_items if not any(w in i.category.lower() for w in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging"])]
"""

content_api = content_api.replace(old_append, new_append)

with open('api/index.py', 'w') as f:
    f.write(content_api)

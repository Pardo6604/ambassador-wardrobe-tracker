with open('src/components/OutfitStudio.tsx', 'r') as f:
    content = f.read()

old_map = """          {OCCASION_FILTERS.map((occ) => {
            const active = selectedOccasion === occ;
          
              <button
                key={occ}"""

new_map = """          {OCCASION_FILTERS.map((occ) => {
            const active = selectedOccasion === occ;
            return (
              <button
                key={occ}"""

content = content.replace(old_map, new_map)

with open('src/components/OutfitStudio.tsx', 'w') as f:
    f.write(content)

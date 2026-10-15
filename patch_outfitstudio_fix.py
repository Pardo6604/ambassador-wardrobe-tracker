with open('src/components/OutfitStudio.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
found = False
skip = False
for line in lines:
    if "const handleAutoSuggest =" in line:
        if found:
            skip = True
        found = True
    
    if skip:
        if "return (" in line:
            skip = False
        continue
        
    new_lines.append(line)

with open('src/components/OutfitStudio.tsx', 'w') as f:
    f.writelines(new_lines)

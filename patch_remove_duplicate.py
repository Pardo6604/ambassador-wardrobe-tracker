with open('src/components/AccountModal.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
found = False
for line in lines:
    if "const fileInputRef = useRef" in line:
        if found:
            continue
        found = True
    new_lines.append(line)

with open('src/components/AccountModal.tsx', 'w') as f:
    f.writelines(new_lines)

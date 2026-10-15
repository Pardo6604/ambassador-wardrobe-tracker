with open('src/components/AccountModal.tsx', 'r') as f:
    content = f.read()

content = content.replace('accept="image/*"', 'accept="image/jpeg, image/png, image/webp, image/jpg"')

with open('src/components/AccountModal.tsx', 'w') as f:
    f.write(content)

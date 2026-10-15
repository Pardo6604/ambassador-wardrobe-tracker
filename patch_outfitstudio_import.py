with open('src/components/OutfitStudio.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { OutfitBuilderModal } from './OutfitBuilderModal';", "import { OutfitBuilderModal } from './OutfitBuilderModal';\nimport { apiService } from '../services/api';")

with open('src/components/OutfitStudio.tsx', 'w') as f:
    f.write(content)

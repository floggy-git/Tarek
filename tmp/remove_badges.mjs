import fs from 'fs';

let content = fs.readFileSync('src/components/TrainerDashboard.tsx', 'utf8');

// Regex for the success badge block
const badgeRegex = /<div className="absolute top-3 left-3 bg-emerald-500\/90[\s\S]*?<\/div>/g;

content = content.replace(badgeRegex, '');

fs.writeFileSync('src/components/TrainerDashboard.tsx', content, 'utf8');
console.log('Badges removed successfully');

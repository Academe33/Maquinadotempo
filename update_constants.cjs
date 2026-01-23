const fs = require('fs');
const path = require('path');

const imagesPath = path.join(__dirname, 'images.json');
const constantsPath = path.join(__dirname, 'constants.tsx');

const images = JSON.parse(fs.readFileSync(imagesPath, 'utf8'));
let constants = fs.readFileSync(constantsPath, 'utf8');

const nameMapping = {
  'Sócrates': 'Socrates',
  'Platão': 'Plato',
  'Aristóteles': 'Aristotle',
  'Confúcio': 'Confucius',
  'Hipátia de Alexandria': 'Hypatia',
  'Cleópatra': 'Cleopatra',
  'Elizabeth I da Inglaterra': 'Elizabeth I',
  'Napoleão Bonaparte': 'Napoleon',
  'Júlio César': 'Julius Caesar',
  'Cristóvão Colombo': 'Christopher Columbus',
  'Fernão de Magalhães': 'Ferdinand Magellan'
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let updatedCount = 0;
let missingCount = 0;

// Create a map for easy lookup
const urlMap = new Map();
images.forEach(img => {
    urlMap.set(img.name, img.url);
});

// Helper function to perform replacement
function updateImage(name, url) {
    if (!url) {
        url = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=512&background=random`;
        console.log(`Using placeholder for: ${name}`);
        missingCount++;
    }

    const nameRegex = new RegExp(`(name:\\s*['"]${escapeRegExp(name)}['"][\\s\\S]*?image:\\s*['"])([^'"]*)(['"])`, 'g');
    
    if (nameRegex.test(constants)) {
        constants = constants.replace(nameRegex, (match, prefix, oldUrl, suffix) => {
            return `${prefix}${url}${suffix}`;
        });
        updatedCount++;
        return true;
    }
    return false;
}

// 1. Update direct matches (English names in constants.tsx or same names)
images.forEach(img => {
   // Try to update using the name from JSON
   updateImage(img.name, img.url);
});

// 2. Update mapped names (Portuguese names in constants.tsx)
for (const [ptName, enName] of Object.entries(nameMapping)) {
    const url = urlMap.get(enName);
    if (url !== undefined) { // Check if we have a URL (even if null, handled by updateImage)
        const found = updateImage(ptName, url);
        if (!found) {
             console.warn(`Could not find character block for mapped name: ${ptName}`);
        }
    } else {
        console.warn(`No URL found for mapped English name: ${enName}`);
    }
}

fs.writeFileSync(constantsPath, constants, 'utf8');

console.log(`Updated ${updatedCount} images.`);
console.log(`Used placeholders for ${missingCount} images.`);

const https = require('https');
const fs = require('fs');
const path = require('path');

const CHARACTERS = [
  { id: 'marie-curie', name: 'Marie Curie' },
  { id: 'einstein', name: 'Albert Einstein' },
  { id: 'ada-lovelace', name: 'Ada Lovelace' },
  { id: 'isaac-newton', name: 'Isaac Newton' },
  { id: 'rosalind-franklin', name: 'Rosalind Franklin' },
  { id: 'charles-darwin', name: 'Charles Darwin' },
  { id: 'katherine-johnson', name: 'Katherine Johnson' },
  { id: 'galileo-galilei', name: 'Galileo Galilei' },
  { id: 'jane-goodall', name: 'Jane Goodall' },
  { id: 'nikola-tesla', name: 'Nikola Tesla' },
  { id: 'socrates', name: 'Sócrates' },
  { id: 'platao', name: 'Platão' },
  { id: 'hannah-arendt', name: 'Hannah Arendt' },
  { id: 'aristoteles', name: 'Aristóteles' },
  { id: 'simone-de-beauvoir', name: 'Simone de Beauvoir' },
  { id: 'confucio', name: 'Confúcio' },
  { id: 'hipatia', name: 'Hipátia' }, // Adjusted name for better search
  { id: 'descartes', name: 'René Descartes' },
  { id: 'judith-butler', name: 'Judith Butler' },
  { id: 'kant', name: 'Immanuel Kant' },
  { id: 'cleytinho-do-grau', name: 'Cleytinho do Grau' },
  { id: 'nelson-mandela', name: 'Nelson Mandela' },
  { id: 'cleopatra', name: 'Cleópatra' },
  { id: 'lincoln', name: 'Abraham Lincoln' },
  { id: 'elizabeth-i', name: 'Elizabeth I' }, // Adjusted
  { id: 'napoleao', name: 'Napoleão Bonaparte' },
  { id: 'angela-merkel', name: 'Angela Merkel' },
  { id: 'julio-cesar', name: 'Júlio César' },
  { id: 'golda-meir', name: 'Golda Meir' },
  { id: 'gandhi', name: 'Mahatma Gandhi' },
  { id: 'thatcher', name: 'Margaret Thatcher' },
  { id: 'da-vinci', name: 'Leonardo da Vinci' },
  { id: 'frida-kahlo', name: 'Frida Kahlo' },
  { id: 'shakespeare', name: 'William Shakespeare' },
  { id: 'virginia-woolf', name: 'Virginia Woolf' },
  { id: 'michelangelo', name: 'Michelangelo' },
  { id: 'maya-angelou', name: 'Maya Angelou' },
  { id: 'picasso', name: 'Pablo Picasso' },
  { id: 'tarsila', name: 'Tarsila do Amaral' },
  { id: 'bach', name: 'Johann Sebastian Bach' },
  { id: 'toni-morrison', name: 'Toni Morrison' },
  { id: 'colombo', name: 'Cristóvão Colombo' },
  { id: 'magalhaes', name: 'Fernão de Magalhães' },
  { id: 'vasco-da-gama', name: 'Vasco da Gama' },
  { id: 'marco-polo', name: 'Marco Polo' },
  { id: 'zheng-he', name: 'Zheng He' },
  { id: 'ibn-battuta', name: 'Ibn Battuta' },
  { id: 'sacagawea', name: 'Sacagawea' },
  { id: 'amundsen', name: 'Roald Amundsen' },
  { id: 'cook', name: 'James Cook' },
  { id: 'livingstone', name: 'David Livingstone' },
  { id: 'muhammad-yunus', name: 'Muhammad Yunus' },
  { id: 'madam-cj-walker', name: 'Madam C. J. Walker' },
  { id: 'ford', name: 'Henry Ford' },
  { id: 'estee-lauder', name: 'Estée Lauder' },
  { id: 'walt-disney', name: 'Walt Disney' },
  { id: 'oprah', name: 'Oprah Winfrey' },
  { id: 'jobs', name: 'Steve Jobs' },
  { id: 'musk', name: 'Elon Musk' },
  { id: 'bezos', name: 'Jeff Bezos' },
  { id: 'ortega', name: 'Amancio Ortega' }
];

const CUSTOM_ENTRIES = {
  'cleytinho-do-grau': `Cleytinho do Grau é uma figura lendária do folclore urbano moderno, conhecido por sua habilidade inigualável de pilotar motocicletas utilizando apenas a roda traseira, manobra conhecida como "dar o grau". Além de suas proezas acrobáticas nas ruas, Cleytinho é um entusiasta da programação e da tecnologia, frequentemente debatendo algoritmos complexos enquanto equilibra sua moto. Ele representa a união improvável entre a cultura de rua e o mundo tech.`
};

function fetchWiki(name) {
  return new Promise((resolve, reject) => {
    const url = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts&titles=${encodeURIComponent(name)}&explaintext=true&format=json&origin=*&redirects=1`;
    
    const options = {
      headers: {
        'User-Agent': 'Maquinadotempo/1.0 (trae-ai-bot; contact@example.com)'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pageId === '-1') {
            resolve(null);
          } else {
            resolve(pages[pageId].extract);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (e) => resolve(null));
  });
}

function fetchEnglishWiki(name) {
  return new Promise((resolve, reject) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&titles=${encodeURIComponent(name)}&explaintext=true&format=json&origin=*&redirects=1`;
    
    const options = {
      headers: {
        'User-Agent': 'Maquinadotempo/1.0 (trae-ai-bot; contact@example.com)'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pageId === '-1') {
            resolve(null);
          } else {
            resolve(pages[pageId].extract);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (e) => resolve(null));
  });
}

async function main() {
  const knowledgeMap = {};
  
  console.log('Iniciando download da Wikipedia...');
  
  for (const char of CHARACTERS) {
    if (CUSTOM_ENTRIES[char.id]) {
      knowledgeMap[char.id] = CUSTOM_ENTRIES[char.id];
      continue;
    }

    process.stdout.write(`Baixando ${char.name}... `);
    let content = await fetchWiki(char.name);
    
    if (!content) {
      process.stdout.write('Tentando EN... ');
      content = await fetchEnglishWiki(char.name);
    }
    
    if (content) {
      knowledgeMap[char.id] = content;
      console.log('OK');
    } else {
      console.log('FALHOU');
      knowledgeMap[char.id] = `Informação sobre ${char.name} não encontrada automaticamente.`;
    }
    
    // Pequeno delay para não bloquear a API
    await new Promise(r => setTimeout(r, 100));
  }

  const fileContent = `export const WIKI_KNOWLEDGE: Record<string, string> = ${JSON.stringify(knowledgeMap, null, 2)};`;
  
  fs.writeFileSync(path.join(__dirname, '../wikiData.ts'), fileContent);
  console.log('Arquivo wikiData.ts gerado com sucesso!');
}

main();

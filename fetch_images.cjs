
const https = require('https');

const characters = [
  'Marie Curie', 'Albert Einstein', 'Ada Lovelace', 'Isaac Newton', 'Rosalind Franklin', 
  'Charles Darwin', 'Katherine Johnson', 'Galileo Galilei', 'Jane Goodall', 'Nikola Tesla',
  'Socrates', 'Plato', 'Hannah Arendt', 'Aristotle', 'Simone de Beauvoir', 
  'Confucius', 'Hypatia', 'René Descartes', 'Judith Butler', 'Immanuel Kant',
  'Nelson Mandela', 'Cleopatra', 'Abraham Lincoln', 'Elizabeth I', 'Napoleon', 
  'Angela Merkel', 'Julius Caesar', 'Golda Meir', 'Mahatma Gandhi', 'Margaret Thatcher',
  'Leonardo da Vinci', 'Frida Kahlo', 'William Shakespeare', 'Virginia Woolf', 'Michelangelo', 
  'Maya Angelou', 'Pablo Picasso', 'Tarsila do Amaral', 'Johann Sebastian Bach', 'Toni Morrison',
  'Christopher Columbus', 'Ferdinand Magellan', 'Vasco da Gama', 'Marco Polo', 'Zheng He', 
  'Ibn Battuta', 'Sacagawea', 'Roald Amundsen', 'James Cook', 'David Livingstone',
  'Muhammad Yunus', 'Madam C. J. Walker', 'Henry Ford', 'Estée Lauder', 'Walt Disney', 
  'Oprah Winfrey', 'Steve Jobs', 'Elon Musk', 'Jeff Bezos', 'Amancio Ortega'
];

// Map some names to Wikipedia titles if they differ significantly
const nameMap = {
  'Socrates': 'Socrates',
  'Plato': 'Plato',
  'Aristotle': 'Aristotle',
  'Confucius': 'Confucius',
  'Hypatia': 'Hypatia',
  'Cleopatra': 'Cleopatra',
  'Napoleon': 'Napoleon',
  'Elizabeth I': 'Elizabeth I',
  'Julius Caesar': 'Julius Caesar',
  'Christopher Columbus': 'Christopher Columbus',
  'Ferdinand Magellan': 'Ferdinand Magellan',
  'Vasco da Gama': 'Vasco da Gama',
  'Marco Polo': 'Marco Polo',
  'Zheng He': 'Zheng He',
  'Ibn Battuta': 'Ibn Battuta',
  'Sacagawea': 'Sacagawea',
  'Roald Amundsen': 'Roald Amundsen',
  'James Cook': 'James Cook',
  'David Livingstone': 'David Livingstone',
  'Madam C. J. Walker': 'Madam C. J. Walker',
  'Estée Lauder': 'Estée Lauder',
  'Walt Disney': 'Walt Disney',
  'Steve Jobs': 'Steve Jobs',
  'Elon Musk': 'Elon Musk',
  'Jeff Bezos': 'Jeff Bezos',
  'Amancio Ortega': 'Amancio Ortega'
};

const fetchImage = (name) => {
  return new Promise((resolve) => {
    const query = nameMap[name] || name;
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=512&origin=*`;
    
    const options = {
      headers: {
        'User-Agent': 'PersonaChat/1.0 (https://personachat.com; contact@personachat.com) Node/18'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pageId === '-1') {
            resolve({ name, url: null, error: 'Page not found' });
          } else {
            const page = pages[pageId];
            if (page.thumbnail) {
              resolve({ name, url: page.thumbnail.source });
            } else {
              resolve({ name, url: null, error: 'No thumbnail' });
            }
          }
        } catch (e) {
          resolve({ name, url: null, error: e.message });
        }
      });
    }).on('error', (e) => resolve({ name, url: null, error: e.message }));
  });
};

const run = async () => {
  console.log('Fetching images...');
  const results = [];
  // Process in batches to avoid rate limits
  for (let i = 0; i < characters.length; i += 5) {
    const batch = characters.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(fetchImage));
    results.push(...batchResults);
    console.log(`Processed ${i + batch.length}/${characters.length}`);
  }
  
  console.log(JSON.stringify(results, null, 2));
};

run();

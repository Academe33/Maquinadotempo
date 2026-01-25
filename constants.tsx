import { Character } from './types';
import { WIKI_KNOWLEDGE } from './wikiData';

const RAW_CHARACTERS: Character[] = [
  {
    id: 'pitagoras',
    name: 'Pitágoras',
    title: 'Matemático e Filósofo',
    category: '📐 MATEMÁTICA',
    description: 'Teorema de Pitágoras (c. 570-495 a.C.)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Kapitolinischer_Pythagoras_adjusted.jpg',
    systemInstruction: 'Você é Pitágoras. Fale sobre a harmonia dos números e o universo.',
    voiceName: 'Charon'
  },
  {
    id: 'euclides',
    name: 'Euclides',
    title: 'Matemático',
    category: '📐 MATEMÁTICA',
    description: 'Geometria euclidiana (c. 300 a.C.)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Euklid-von-Alexandria_1.jpg',
    systemInstruction: 'Você é Euclides. Explique o mundo através de axiomas e provas geométricas.',
    voiceName: 'Charon'
  },
  {
    id: 'isaac-newton-math',
    name: 'Isaac Newton',
    title: 'Matemático e Físico',
    category: '📐 MATEMÁTICA',
    description: 'Cálculo (1643-1727)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Portrait_of_Sir_Isaac_Newton%2C_1689_%28brightened%29.jpg/1280px-Portrait_of_Sir_Isaac_Newton%2C_1689_%28brightened%29.jpg',
    systemInstruction: 'Você é Isaac Newton. Discuta o desenvolvimento do cálculo e as leis do universo.',
    voiceName: 'Puck'
  },
  {
    id: 'carl-friedrich-gauss',
    name: 'Carl Friedrich Gauss',
    title: 'Matemático',
    category: '📐 MATEMÁTICA',
    description: 'Teoria dos números (1777-1855)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Carl_Friedrich_Gauss.jpg',
    systemInstruction: 'Você é Carl Friedrich Gauss. Fale sobre a beleza da teoria dos números.',
    voiceName: 'Charon'
  },
  {
    id: 'leonhard-euler',
    name: 'Leonhard Euler',
    title: 'Matemático',
    category: '📐 MATEMÁTICA',
    description: 'Análise matemática (1707-1783)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Leonhard_Euler_2.jpg',
    systemInstruction: 'Você é Leonhard Euler. Explore as conexões profundas da análise matemática.',
    voiceName: 'Charon'
  },
  {
    id: 'rene-descartes-math',
    name: 'René Descartes',
    title: 'Matemático e Filósofo',
    category: '📐 MATEMÁTICA',
    description: 'Geometria analítica (1596-1650)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Frans_Hals_-_Portret_van_Ren%C3%A9_Descartes.jpg',
    systemInstruction: 'Você é René Descartes. Explique como uniu a geometria à álgebra.',
    voiceName: 'Charon'
  },
  {
    id: 'hipatia-de-alexandria',
    name: 'Hipatia de Alexandria',
    title: 'Matemática e Filósofa',
    category: '📐 MATEMÁTICA',
    description: 'Matemática e astronomia (c. 360-415)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Hypatia_portrait.png/1176px-Hypatia_portrait.png',
    systemInstruction: 'Você é Hipatia. Defenda o conhecimento e a ciência na antiga Alexandria.',
    voiceName: 'Kore'
  },
  {
    id: 'ada-lovelace',
    name: 'Ada Lovelace',
    title: 'Matemática',
    category: '📐 MATEMÁTICA',
    description: 'Primeiro algoritmo computacional (1815-1852)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Ada_Lovelace_daguerreotype_by_Antoine_Claudet_1843_-_cropped.png',
    systemInstruction: 'Você é Ada Lovelace. Imagine o futuro dos computadores e a poesia da lógica.',
    voiceName: 'Kore'
  },
  {
    id: 'emmy-noether',
    name: 'Emmy Noether',
    title: 'Matemática',
    category: '📐 MATEMÁTICA',
    description: 'Álgebra abstrata (1882-1935)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Noether.jpg/1208px-Noether.jpg',
    systemInstruction: 'Você é Emmy Noether. Explique as estruturas fundamentais da álgebra.',
    voiceName: 'Kore'
  },
  {
    id: 'sofia-kovalevskaya',
    name: 'Sofia Kovalevskaya',
    title: 'Matemática',
    category: '📐 MATEMÁTICA',
    description: 'Equações diferenciais (1850-1891)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Sofja_Wassiljewna_Kowalewskaja_1.jpg',
    systemInstruction: 'Você é Sofia Kovalevskaya. Fale sobre suas contribuições às equações diferenciais.',
    voiceName: 'Kore'
  },
  {
    id: 'maryam-mirzakhani',
    name: 'Maryam Mirzakhani',
    title: 'Matemática',
    category: '📐 MATEMÁTICA',
    description: 'Geometria e sistemas dinâmicos (1977-2017)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Maryam_Mirzakhani_in_Seoul_2014.jpg',
    systemInstruction: 'Você é Maryam Mirzakhani. Descreva a beleza das superfícies curvas.',
    voiceName: 'Kore'
  },
  {
    id: 'katherine-johnson',
    name: 'Katherine Johnson',
    title: 'Matemática',
    category: '📐 MATEMÁTICA',
    description: 'Cálculos orbitais da NASA (1918-2020)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Katherine_Johnson_1983.jpg/1280px-Katherine_Johnson_1983.jpg',
    systemInstruction: 'Você é Katherine Johnson. Conte sobre os cálculos que levaram a humanidade ao espaço.',
    voiceName: 'Kore'
  },
  {
    id: 'isaac-newton-phys',
    name: 'Isaac Newton',
    title: 'Físico',
    category: '⚛️ FÍSICA',
    description: 'Leis do movimento e gravitação (1643-1727)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Portrait_of_Sir_Isaac_Newton%2C_1689_%28brightened%29.jpg/1280px-Portrait_of_Sir_Isaac_Newton%2C_1689_%28brightened%29.jpg',
    systemInstruction: 'Você é Isaac Newton. Explique a gravidade e as leis do movimento.',
    voiceName: 'Puck'
  },
  {
    id: 'albert-einstein',
    name: 'Albert Einstein',
    title: 'Físico Teórico',
    category: '⚛️ FÍSICA',
    description: 'Teoria da relatividade (1879-1955)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/1280px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg',
    systemInstruction: 'Você é Albert Einstein. Fale sobre o tempo, o espaço e a relatividade.',
    voiceName: 'Charon'
  },
  {
    id: 'galileu-galilei',
    name: 'Galileu Galilei',
    title: 'Físico e Astrônomo',
    category: '⚛️ FÍSICA',
    description: 'Mecânica e astronomia (1564-1642)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Justus_Sustermans_-_Portrait_of_Galileo_Galilei%2C_1636.jpg/1280px-Justus_Sustermans_-_Portrait_of_Galileo_Galilei%2C_1636.jpg',
    systemInstruction: 'Você é Galileu Galilei. Defenda o heliocentrismo e o método experimental.',
    voiceName: 'Puck'
  },
  {
    id: 'nikola-tesla',
    name: 'Nikola Tesla',
    title: 'Físico e Inventor',
    category: '⚛️ FÍSICA',
    description: 'Eletromagnetismo (1856-1943)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Tesla_circa_1890.jpeg',
    systemInstruction: 'Você é Nikola Tesla. Fale sobre a eletricidade e o futuro da energia.',
    voiceName: 'Charon'
  },
  {
    id: 'stephen-hawking',
    name: 'Stephen Hawking',
    title: 'Físico Teórico',
    category: '⚛️ FÍSICA',
    description: 'Buracos negros (1942-2018)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Stephen_Hawking.StarChild.jpg',
    systemInstruction: 'Você é Stephen Hawking. Explique os mistérios do universo e dos buracos negros.',
    voiceName: 'Charon'
  },
  {
    id: 'richard-feynman',
    name: 'Richard Feynman',
    title: 'Físico Teórico',
    category: '⚛️ FÍSICA',
    description: 'Eletrodinâmica quântica (1918-1988)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/RichardFeynman-PaineMansionWoods1984_copyrightTamikoThiel_bw.jpg',
    systemInstruction: 'Você é Richard Feynman. Ensine física com clareza e entusiasmo.',
    voiceName: 'Charon'
  },
  {
    id: 'marie-curie-phys',
    name: 'Marie Curie',
    title: 'Física',
    category: '⚛️ FÍSICA',
    description: 'Radioatividade (1867-1934)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Marie_Curie_c1920.jpg/1280px-Marie_Curie_c1920.jpg',
    systemInstruction: 'Você é Marie Curie. Fale sobre suas pesquisas pioneiras em radioatividade.',
    voiceName: 'Kore'
  },
  {
    id: 'lise-meitner',
    name: 'Lise Meitner',
    title: 'Física',
    category: '⚛️ FÍSICA',
    description: 'Fissão nuclear (1878-1968)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Lise_Meitner_%281878-1968%29%2C_lecturing_at_Catholic_University%2C_Washington%2C_D.C.%2C_1946.jpg/1280px-Lise_Meitner_%281878-1968%29%2C_lecturing_at_Catholic_University%2C_Washington%2C_D.C.%2C_1946.jpg',
    systemInstruction: 'Você é Lise Meitner. Explique a descoberta da fissão nuclear.',
    voiceName: 'Kore'
  },
  {
    id: 'emmy-noether-phys',
    name: 'Emmy Noether',
    title: 'Física e Matemática',
    category: '⚛️ FÍSICA',
    description: 'Teorema de Noether em física (1882-1935)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Noether.jpg/1208px-Noether.jpg',
    systemInstruction: 'Você é Emmy Noether. Conecte simetrias físicas a leis de conservação.',
    voiceName: 'Kore'
  },
  {
    id: 'chien-shiung-wu',
    name: 'Chien-Shiung Wu',
    title: 'Física Experimental',
    category: '⚛️ FÍSICA',
    description: 'Física nuclear (1912-1997)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Chien-Shiung_Wu_%281912-1997%29_in_1958.jpg/1280px-Chien-Shiung_Wu_%281912-1997%29_in_1958.jpg',
    systemInstruction: 'Você é Chien-Shiung Wu. Fale sobre seus experimentos cruciais em física nuclear.',
    voiceName: 'Kore'
  },
  {
    id: 'rosalind-franklin-phys',
    name: 'Rosalind Franklin',
    title: 'Biofísica',
    category: '⚛️ FÍSICA',
    description: 'Cristalografia de raios-X (1920-1958)',
    image: 'https://upload.wikimedia.org/wikipedia/pt/9/97/Rosalind_Franklin.jpg',
    systemInstruction: 'Você é Rosalind Franklin. Explique a técnica de cristalografia de raios-X.',
    voiceName: 'Kore'
  },
  {
    id: 'vera-rubin',
    name: 'Vera Rubin',
    title: 'Astrônoma',
    category: '⚛️ FÍSICA',
    description: 'Matéria escura (1928-2016)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Vera_Rubin.jpg',
    systemInstruction: 'Você é Vera Rubin. Fale sobre a evidência da matéria escura nas galáxias.',
    voiceName: 'Kore'
  },
  {
    id: 'antoine-lavoisier',
    name: 'Antoine Lavoisier',
    title: 'Químico',
    category: '🧪 QUÍMICA',
    description: 'Pai da química moderna (1743-1794)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/David_-_Portrait_of_Monsieur_Lavoisier_%28cropped%29.jpg/1097px-David_-_Portrait_of_Monsieur_Lavoisier_%28cropped%29.jpg',
    systemInstruction: 'Você é Antoine Lavoisier. Estabeleça as bases da química moderna e a conservação da massa.',
    voiceName: 'Charon'
  },
  {
    id: 'dmitri-mendeleev',
    name: 'Dmitri Mendeleev',
    title: 'Químico',
    category: '🧪 QUÍMICA',
    description: 'Tabela periódica (1834-1907)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/%EB%93%9C%EB%AF%B8%ED%8A%B8%EB%A6%AC_%EB%A9%98%EB%8D%B8%EB%A0%88%EC%98%88%ED%94%84.jpg/1280px-%EB%93%9C%EB%AF%B8%ED%8A%B8%EB%A6%AC_%EB%A9%98%EB%8D%B8%EB%A0%88%EC%98%88%ED%94%84.jpg',
    systemInstruction: 'Você é Dmitri Mendeleev. Explique a organização dos elementos na tabela periódica.',
    voiceName: 'Charon'
  },
  {
    id: 'john-dalton',
    name: 'John Dalton',
    title: 'Químico',
    category: '🧪 QUÍMICA',
    description: 'Teoria atômica (1766-1844)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Dalton_John_desk.jpg/1280px-Dalton_John_desk.jpg',
    systemInstruction: 'Você é John Dalton. Introduza a teoria atômica moderna.',
    voiceName: 'Charon'
  },
  {
    id: 'linus-pauling',
    name: 'Linus Pauling',
    title: 'Químico',
    category: '🧪 QUÍMICA',
    description: 'Ligações químicas (1901-1994)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/db/Pauling.jpg',
    systemInstruction: 'Você é Linus Pauling. Fale sobre a natureza das ligações químicas.',
    voiceName: 'Charon'
  },
  {
    id: 'robert-boyle',
    name: 'Robert Boyle',
    title: 'Químico',
    category: '🧪 QUÍMICA',
    description: 'Lei de Boyle (1627-1691)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Robert_Boyle_0001.jpg',
    systemInstruction: 'Você é Robert Boyle. Discuta o comportamento dos gases.',
    voiceName: 'Charon'
  },
  {
    id: 'louis-pasteur-chem',
    name: 'Louis Pasteur',
    title: 'Químico e Microbiologista',
    category: '🧪 QUÍMICA',
    description: 'Microbiologia e química (1822-1895)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Louis_Pasteur%2C_foto_av_Paul_Nadar%2C_Crisco_edit.jpg/1280px-Louis_Pasteur%2C_foto_av_Paul_Nadar%2C_Crisco_edit.jpg',
    systemInstruction: 'Você é Louis Pasteur. Explique a relação entre química e microrganismos.',
    voiceName: 'Charon'
  },
  {
    id: 'marie-curie-chem',
    name: 'Marie Curie',
    title: 'Química',
    category: '🧪 QUÍMICA',
    description: 'Elementos radioativos (1867-1934)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Marie_Curie_c1920.jpg/1280px-Marie_Curie_c1920.jpg',
    systemInstruction: 'Você é Marie Curie. Fale sobre a descoberta do Rádio e do Polônio.',
    voiceName: 'Kore'
  },
  {
    id: 'dorothy-hodgkin',
    name: 'Dorothy Hodgkin',
    title: 'Química',
    category: '🧪 QUÍMICA',
    description: 'Cristalografia de proteínas (1910-1994)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Dorothy_Hodgkin_im_Talar.jpg/1027px-Dorothy_Hodgkin_im_Talar.jpg',
    systemInstruction: 'Você é Dorothy Hodgkin. Descreva a estrutura das biomoléculas.',
    voiceName: 'Kore'
  },
  {
    id: 'rosalind-franklin-chem',
    name: 'Rosalind Franklin',
    title: 'Química',
    category: '🧪 QUÍMICA',
    description: 'Estrutura do DNA (1920-1958)',
    image: 'https://upload.wikimedia.org/wikipedia/pt/9/97/Rosalind_Franklin.jpg',
    systemInstruction: 'Você é Rosalind Franklin. Fale sobre a química do DNA.',
    voiceName: 'Kore'
  },
  {
    id: 'irene-joliot-curie',
    name: 'Irène Joliot-Curie',
    title: 'Química',
    category: '🧪 QUÍMICA',
    description: 'Radioatividade artificial (1897-1956)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Joliot-curie.jpg',
    systemInstruction: 'Você é Irène Joliot-Curie. Explique a síntese de novos elementos radioativos.',
    voiceName: 'Kore'
  },
  {
    id: 'rachel-carson-chem',
    name: 'Rachel Carson',
    title: 'Bióloga e Química',
    category: '🧪 QUÍMICA',
    description: 'Química ambiental (1907-1964)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Rachel-Carson.jpg/1117px-Rachel-Carson.jpg',
    systemInstruction: 'Você é Rachel Carson. Alerte sobre os impactos químicos no meio ambiente.',
    voiceName: 'Kore'
  },
  {
    id: 'alice-ball',
    name: 'Alice Ball',
    title: 'Química',
    category: '🧪 QUÍMICA',
    description: 'Tratamento químico da hanseníase (1892-1916)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Alice_Augusta_Ball.jpg',
    systemInstruction: 'Você é Alice Ball. Fale sobre o desenvolvimento do tratamento para a hanseníase.',
    voiceName: 'Kore'
  },
  {
    id: 'charles-darwin',
    name: 'Charles Darwin',
    title: 'Naturalista',
    category: '🧬 BIOLOGIA',
    description: 'Teoria da evolução (1809-1882)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Charles_Darwin_seated_crop.jpg/1280px-Charles_Darwin_seated_crop.jpg',
    systemInstruction: 'Você é Charles Darwin. Explique a seleção natural e a origem das espécies.',
    voiceName: 'Charon'
  },
  {
    id: 'gregor-mendel',
    name: 'Gregor Mendel',
    title: 'Biólogo e Monge',
    category: '🧬 BIOLOGIA',
    description: 'Genética (1822-1884)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Gregor_Mendel_2.jpg',
    systemInstruction: 'Você é Gregor Mendel. Fale sobre a hereditariedade e as ervilhas.',
    voiceName: 'Charon'
  },
  {
    id: 'louis-pasteur-bio',
    name: 'Louis Pasteur',
    title: 'Microbiologista',
    category: '🧬 BIOLOGIA',
    description: 'Microbiologia (1822-1895)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Louis_Pasteur%2C_foto_av_Paul_Nadar%2C_Crisco_edit.jpg/1280px-Louis_Pasteur%2C_foto_av_Paul_Nadar%2C_Crisco_edit.jpg',
    systemInstruction: 'Você é Louis Pasteur. Discuta a teoria dos germes e a vacinação.',
    voiceName: 'Charon'
  },
  {
    id: 'alexander-fleming',
    name: 'Alexander Fleming',
    title: 'Biólogo e Farmacologista',
    category: '🧬 BIOLOGIA',
    description: 'Penicilina (1881-1955)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Synthetic_Production_of_Penicillin_TR1468.jpg/1280px-Synthetic_Production_of_Penicillin_TR1468.jpg',
    systemInstruction: 'Você é Alexander Fleming. Conte sobre a descoberta da penicilina.',
    voiceName: 'Charon'
  },
  {
    id: 'carl-linnaeus',
    name: 'Carl Linnaeus',
    title: 'Botânico e Zoólogo',
    category: '🧬 BIOLOGIA',
    description: 'Taxonomia (1707-1778)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Carl_von_Linn%C3%A9%2C_1707-1778%2C_botanist%2C_professor_%28Alexander_Roslin%29_-_Nationalmuseum_-_15723_%28cropped%29.tif/lossy-page1-1024px-Carl_von_Linn%C3%A9%2C_1707-1778%2C_botanist%2C_professor_%28Alexander_Roslin%29_-_Nationalmuseum_-_15723_%28cropped%29.tif.jpg',
    systemInstruction: 'Você é Carl Linnaeus. Explique a classificação dos seres vivos.',
    voiceName: 'Charon'
  },
  {
    id: 'andreas-vesalius',
    name: 'Andreas Vesalius',
    title: 'Anatomista',
    category: '🧬 BIOLOGIA',
    description: 'Anatomia humana (1514-1564)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Bruxelles_%C3%A0_travers_les_%C3%A2ges_%281884%29_%2814800701083%29.jpg/1280px-Bruxelles_%C3%A0_travers_les_%C3%A2ges_%281884%29_%2814800701083%29.jpg',
    systemInstruction: 'Você é Andreas Vesalius. Descreva a estrutura do corpo humano.',
    voiceName: 'Charon'
  },
  {
    id: 'jane-goodall',
    name: 'Jane Goodall',
    title: 'Primatologista',
    category: '🧬 BIOLOGIA',
    description: 'Primatologia (1934-presente)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Jane_Goodall_2010_%28cropped%29.jpg/1280px-Jane_Goodall_2010_%28cropped%29.jpg',
    systemInstruction: 'Você é Jane Goodall. Fale sobre o comportamento dos chimpanzés e a conservação.',
    voiceName: 'Kore'
  },
  {
    id: 'barbara-mcclintock',
    name: 'Barbara McClintock',
    title: 'Geneticista',
    category: '🧬 BIOLOGIA',
    description: 'Genética de transposons (1902-1992)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Barbara_McClintock_%281902-1992%29_shown_in_her_laboratory_in_1947.jpg/1280px-Barbara_McClintock_%281902-1992%29_shown_in_her_laboratory_in_1947.jpg',
    systemInstruction: 'Você é Barbara McClintock. Explique os elementos genéticos móveis.',
    voiceName: 'Kore'
  },
  {
    id: 'rachel-carson-bio',
    name: 'Rachel Carson',
    title: 'Bióloga Marinha',
    category: '🧬 BIOLOGIA',
    description: 'Biologia marinha e ecologia (1907-1964)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Rachel-Carson.jpg/1117px-Rachel-Carson.jpg',
    systemInstruction: 'Você é Rachel Carson. Fale sobre a vida nos oceanos e o equilíbrio ecológico.',
    voiceName: 'Kore'
  },
  {
    id: 'rosalind-franklin-bio',
    name: 'Rosalind Franklin',
    title: 'Bióloga Molecular',
    category: '🧬 BIOLOGIA',
    description: 'Estrutura do DNA (1920-1958)',
    image: 'https://upload.wikimedia.org/wikipedia/pt/9/97/Rosalind_Franklin.jpg',
    systemInstruction: 'Você é Rosalind Franklin. Descreva a dupla hélice do DNA.',
    voiceName: 'Kore'
  },
  {
    id: 'rita-levi-montalcini',
    name: 'Rita Levi-Montalcini',
    title: 'Neurobióloga',
    category: '🧬 BIOLOGIA',
    description: 'Neurobiologia (1909-2012)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Rita_Levi-Montalcini_%281986%29.png/1280px-Rita_Levi-Montalcini_%281986%29.png',
    systemInstruction: 'Você é Rita Levi-Montalcini. Fale sobre o fator de crescimento nervoso.',
    voiceName: 'Kore'
  },
  {
    id: 'lynn-margulis',
    name: 'Lynn Margulis',
    title: 'Bióloga',
    category: '🧬 BIOLOGIA',
    description: 'Teoria endossimbiótica (1938-2011)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Lynn_Margulis.jpg',
    systemInstruction: 'Você é Lynn Margulis. Explique a origem das células eucarióticas.',
    voiceName: 'Kore'
  },
  {
    id: 'herodoto',
    name: 'Heródoto',
    title: 'Historiador',
    category: '📜 HISTÓRIA',
    description: 'Pai da história (c. 484-425 a.C.)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/AGMA_H%C3%A9rodote.jpg/1200px-AGMA_H%C3%A9rodote.jpg',
    systemInstruction: 'Você é Heródoto. Conte as histórias das guerras greco-persas e do mundo antigo.',
    voiceName: 'Charon'
  },
  {
    id: 'tucidides',
    name: 'Tucídides',
    title: 'Historiador',
    category: '📜 HISTÓRIA',
    description: 'História crítica (c. 460-400 a.C.)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Thucydides-bust-cutout_ROM.jpg',
    systemInstruction: 'Você é Tucídides. Analise a Guerra do Peloponeso com rigor e objetividade.',
    voiceName: 'Charon'
  },
  {
    id: 'marc-bloch',
    name: 'Marc Bloch',
    title: 'Historiador',
    category: '📜 HISTÓRIA',
    description: 'Escola dos Annales (1886-1944)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Marc_Bloch.jpg',
    systemInstruction: 'Você é Marc Bloch. Fale sobre a história social e a longa duração.',
    voiceName: 'Charon'
  },
  {
    id: 'edward-gibbon',
    name: 'Edward Gibbon',
    title: 'Historiador',
    category: '📜 HISTÓRIA',
    description: 'História do Império Romano (1737-1794)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Edward_Gibbon_by_Henry_Walton_cleaned.jpg/1280px-Edward_Gibbon_by_Henry_Walton_cleaned.jpg',
    systemInstruction: 'Você é Edward Gibbon. Narre o declínio e queda do Império Romano.',
    voiceName: 'Charon'
  },
  {
    id: 'leopold-von-ranke',
    name: 'Leopold von Ranke',
    title: 'Historiador',
    category: '📜 HISTÓRIA',
    description: 'História científica (1795-1886)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Jebens%2C_Adolf_-_Leopold_von_Ranke_%28detail%29_-_1875.jpg',
    systemInstruction: 'Você é Leopold von Ranke. Defenda a história baseada em fontes primárias.',
    voiceName: 'Charon'
  },
  {
    id: 'fernand-braudel',
    name: 'Fernand Braudel',
    title: 'Historiador',
    category: '📜 HISTÓRIA',
    description: 'História de longa duração (1902-1985)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Fernand_Braudel_%281902-1985%29.jpg',
    systemInstruction: 'Você é Fernand Braudel. Analise o Mediterrâneo e as estruturas históricas.',
    voiceName: 'Charon'
  },
  {
    id: 'mary-beard',
    name: 'Mary Beard',
    title: 'Historiadora',
    category: '📜 HISTÓRIA',
    description: 'História antiga (1955-presente)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Mary_Beard_UC3M_2017_%28cropped%29.JPG',
    systemInstruction: 'Você é Mary Beard. Desmistifique a Roma Antiga.',
    voiceName: 'Kore'
  },
  {
    id: 'natalie-zemon-davis',
    name: 'Natalie Zemon Davis',
    title: 'Historiadora',
    category: '📜 HISTÓRIA',
    description: 'História cultural (1928-2023)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Natalie_Zemon_Davis_%28cropped%29.jpg',
    systemInstruction: 'Você é Natalie Zemon Davis. Explore a vida das pessoas comuns na história.',
    voiceName: 'Kore'
  },
  {
    id: 'gerda-lerner',
    name: 'Gerda Lerner',
    title: 'Historiadora',
    category: '📜 HISTÓRIA',
    description: 'História das mulheres (1920-2013)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/UW-Madison_history_professor_Gerda_Lerner.jpg/1227px-UW-Madison_history_professor_Gerda_Lerner.jpg',
    systemInstruction: 'Você é Gerda Lerner. Fale sobre o papel das mulheres na história.',
    voiceName: 'Kore'
  },
  {
    id: 'barbara-tuchman',
    name: 'Barbara Tuchman',
    title: 'Historiadora',
    category: '📜 HISTÓRIA',
    description: 'História narrativa (1912-1989)',
    image: 'https://ui-avatars.com/api/?name=Barbara+Tuchman&background=random&size=256',
    systemInstruction: 'Você é Barbara Tuchman. Conte a história como uma narrativa envolvente.',
    voiceName: 'Kore'
  },
  {
    id: 'joan-wallach-scott',
    name: 'Joan Wallach Scott',
    title: 'Historiadora',
    category: '📜 HISTÓRIA',
    description: 'História do gênero (1941-presente)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Joan_Wallach_Scott_%28cropped%29.jpg',
    systemInstruction: 'Você é Joan Wallach Scott. Analise a história através da lente do gênero.',
    voiceName: 'Kore'
  },
  {
    id: 'sima-qian',
    name: 'Sima Qian',
    title: 'Historiador',
    category: '📜 HISTÓRIA',
    description: 'Historiador chinês (c. 145-86 a.C.)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Sima_Qian_%28painted_portrait%29.jpg',
    systemInstruction: 'Você é Sima Qian. Registre a história da China Antiga.',
    voiceName: 'Charon'
  },
  {
    id: 'alexander-von-humboldt',
    name: 'Alexander von Humboldt',
    title: 'Geógrafo e Naturalista',
    category: '🌍 GEOGRAFIA',
    description: 'Geografia moderna (1769-1859)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Stieler%2C_Joseph_Karl_-_Alexander_von_Humboldt_-_1843.jpg',
    systemInstruction: 'Você é Alexander von Humboldt. Descreva a natureza como um todo interconectado.',
    voiceName: 'Charon'
  },
  {
    id: 'eratostenes',
    name: 'Eratóstenes',
    title: 'Geógrafo e Matemático',
    category: '🌍 GEOGRAFIA',
    description: 'Circunferência da Terra (c. 276-194 a.C.)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Portrait_of_Eratosthenes.png',
    systemInstruction: 'Você é Eratóstenes. Explique como mediu a Terra na antiguidade.',
    voiceName: 'Charon'
  },
  {
    id: 'carl-ritter',
    name: 'Carl Ritter',
    title: 'Geógrafo',
    category: '🌍 GEOGRAFIA',
    description: 'Geografia sistemática (1779-1859)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Carl_Ritter_Litho.jpg/1280px-Carl_Ritter_Litho.jpg',
    systemInstruction: 'Você é Carl Ritter. Fale sobre a influência do ambiente na história humana.',
    voiceName: 'Charon'
  },
  {
    id: 'vidal-de-la-blache',
    name: 'Vidal de La Blache',
    title: 'Geógrafo',
    category: '🌍 GEOGRAFIA',
    description: 'Geografia humana (1845-1918)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/VIdal_de_la_Blache%2C_Paul%2C_BNF_Gallica.jpg/1280px-VIdal_de_la_Blache%2C_Paul%2C_BNF_Gallica.jpg',
    systemInstruction: 'Você é Vidal de La Blache. Explique o possibilismo geográfico.',
    voiceName: 'Charon'
  },
  {
    id: 'milton-santos',
    name: 'Milton Santos',
    title: 'Geógrafo',
    category: '🌍 GEOGRAFIA',
    description: 'Geografia crítica brasileira (1926-2001)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Milton_Santos_%28TV_Brasil%29.jpg',
    systemInstruction: 'Você é Milton Santos. Analise a globalização e o espaço geográfico.',
    voiceName: 'Charon'
  },
  {
    id: 'al-idrisi',
    name: 'Al-Idrisi',
    title: 'Cartógrafo',
    category: '🌍 GEOGRAFIA',
    description: 'Cartografia (1100-1165)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Estatua_de_Al-Idrisi_bajo_el_baluarte_de_los_Mallorquines%2C_Ceuta_%285%29.jpg/1096px-Estatua_de_Al-Idrisi_bajo_el_baluarte_de_los_Mallorquines%2C_Ceuta_%285%29.jpg',
    systemInstruction: 'Você é Al-Idrisi. Descreva o mundo conhecido medieval através de seus mapas.',
    voiceName: 'Charon'
  },
  {
    id: 'ellen-churchill-semple',
    name: 'Ellen Churchill Semple',
    title: 'Geógrafa',
    category: '🌍 GEOGRAFIA',
    description: 'Geografia ambiental (1863-1932)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Ellen-Churchill-Semple.jpg',
    systemInstruction: 'Você é Ellen Churchill Semple. Discuta a geografia antropogeográfica.',
    voiceName: 'Kore'
  },
  {
    id: 'doreen-massey',
    name: 'Doreen Massey',
    title: 'Geógrafa',
    category: '🌍 GEOGRAFIA',
    description: 'Geografia social (1944-2016)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Doreen_Massey.jpg',
    systemInstruction: 'Você é Doreen Massey. Fale sobre espaço, lugar e poder.',
    voiceName: 'Kore'
  },
  {
    id: 'yi-fu-tuan',
    name: 'Yi-Fu Tuan',
    title: 'Geógrafo',
    category: '🌍 GEOGRAFIA',
    description: 'Geografia humanística (1930-2022)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Yi-Fu_Tuan-Festival_international_de_g%C3%A9ographie_2012_%281%29.jpg/1280px-Yi-Fu_Tuan-Festival_international_de_g%C3%A9ographie_2012_%281%29.jpg',
    systemInstruction: 'Você é Yi-Fu Tuan. Explore a topofilia e a percepção do lugar.',
    voiceName: 'Charon'
  },
  {
    id: 'gertrude-bell',
    name: 'Gertrude Bell',
    title: 'Exploradora e Geógrafa',
    category: '🌍 GEOGRAFIA',
    description: 'Exploradora e geógrafa (1868-1926)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/BellK_218_Gertrude_Bell_in_Iraq_in_1909_age_41.jpg/1280px-BellK_218_Gertrude_Bell_in_Iraq_in_1909_age_41.jpg',
    systemInstruction: 'Você é Gertrude Bell. Conte sobre suas viagens e mapas do Oriente Médio.',
    voiceName: 'Kore'
  },
  {
    id: 'freya-stark',
    name: 'Freya Stark',
    title: 'Exploradora',
    category: '🌍 GEOGRAFIA',
    description: 'Geografia e exploração (1893-1993)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Dame_Freya_Madeline_Stark_%281923%29.jpg/1280px-Dame_Freya_Madeline_Stark_%281923%29.jpg',
    systemInstruction: 'Você é Freya Stark. Descreva as paisagens e culturas que encontrou.',
    voiceName: 'Kore'
  },
  {
    id: 'maria-montessori',
    name: 'Maria Montessori',
    title: 'Educadora',
    category: '🌍 GEOGRAFIA',
    description: 'Geografia educacional (1870-1952)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Maria_Montessori.jpg',
    systemInstruction: 'Você é Maria Montessori. Explique como ensinar geografia e o mundo às crianças.',
    voiceName: 'Kore'
  },
  {
    id: 'socrates',
    name: 'Sócrates',
    title: 'Filósofo',
    category: '🤔 FILOSOFIA',
    description: 'Método socrático (c. 470-399 a.C.)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/%CE%A3%CF%89%CE%BA%CF%81%CE%AC%CF%84%CE%B7%CF%82%2C_%CE%91%CE%BA%CE%B1%CE%B4%CE%B7%CE%BC%CE%AF%CE%B1_%CE%91%CE%B8%CE%B7%CE%BD%CF%8E%CE%BD_6616.jpg/1280px-%CE%A3%CF%89%CE%BA%CF%81%CE%AC%CF%84%CE%B7%CF%82%2C_%CE%91%CE%BA%CE%B1%CE%B4%CE%B7%CE%BC%CE%AF%CE%B1_%CE%91%CE%B8%CE%B7%CE%BD%CF%8E%CE%BD_6616.jpg',
    systemInstruction: 'Você é Sócrates. Questione tudo e busque a verdade através do diálogo.',
    voiceName: 'Charon'
  },
  {
    id: 'platao',
    name: 'Platão',
    title: 'Filósofo',
    category: '🤔 FILOSOFIA',
    description: 'Idealismo (c. 428-348 a.C.)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Plato_Silanion_Musei_Capitolini_MC1377.jpg/1280px-Plato_Silanion_Musei_Capitolini_MC1377.jpg',
    systemInstruction: 'Você é Platão. Fale sobre o mundo das ideias e a República.',
    voiceName: 'Charon'
  },
  {
    id: 'aristoteles',
    name: 'Aristóteles',
    title: 'Filósofo',
    category: '🤔 FILOSOFIA',
    description: 'Lógica e metafísica (384-322 a.C.)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Aristotle_Altemps_Inv8575.jpg/1280px-Aristotle_Altemps_Inv8575.jpg',
    systemInstruction: 'Você é Aristóteles. Sistematize o conhecimento e a ética.',
    voiceName: 'Charon'
  },
  {
    id: 'rene-descartes-phil',
    name: 'René Descartes',
    title: 'Filósofo',
    category: '🤔 FILOSOFIA',
    description: '"Penso, logo existo" (1596-1650)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Frans_Hals_-_Portret_van_Ren%C3%A9_Descartes.jpg',
    systemInstruction: 'Você é René Descartes. Duvide de tudo para encontrar a certeza.',
    voiceName: 'Charon'
  },
  {
    id: 'immanuel-kant',
    name: 'Immanuel Kant',
    title: 'Filósofo',
    category: '🤔 FILOSOFIA',
    description: 'Criticismo (1724-1804)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Immanuel_Kant_-_Gemaelde_2.jpg',
    systemInstruction: 'Você é Immanuel Kant. Fale sobre a razão pura e o imperativo categórico.',
    voiceName: 'Charon'
  },
  {
    id: 'friedrich-nietzsche',
    name: 'Friedrich Nietzsche',
    title: 'Filósofo',
    category: '🤔 FILOSOFIA',
    description: 'Filosofia existencial (1844-1900)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Nietzsche187a.jpg/1280px-Nietzsche187a.jpg',
    systemInstruction: 'Você é Friedrich Nietzsche. Desafie a moralidade tradicional e fale sobre o super-homem.',
    voiceName: 'Charon'
  },
  {
    id: 'simone-de-beauvoir',
    name: 'Simone de Beauvoir',
    title: 'Filósofa',
    category: '🤔 FILOSOFIA',
    description: 'Existencialismo feminista (1908-1986)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Simone_de_Beauvoir2.png',
    systemInstruction: 'Você é Simone de Beauvoir. Discuta a liberdade e a condição feminina.',
    voiceName: 'Kore'
  },
  {
    id: 'hannah-arendt',
    name: 'Hannah Arendt',
    title: 'Filósofa Política',
    category: '🤔 FILOSOFIA',
    description: 'Filosofia política (1906-1975)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Hannah_Arendt_1933.jpg/1246px-Hannah_Arendt_1933.jpg',
    systemInstruction: 'Você é Hannah Arendt. Analise o poder, a autoridade e o totalitarismo.',
    voiceName: 'Kore'
  },
  {
    id: 'hipatia-de-alexandria-phil',
    name: 'Hipatia de Alexandria',
    title: 'Filósofa',
    category: '🤔 FILOSOFIA',
    description: 'Neoplatonismo (c. 360-415)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Hypatia_portrait.png/1176px-Hypatia_portrait.png',
    systemInstruction: 'Você é Hipatia. Ensine o neoplatonismo e o amor pela sabedoria.',
    voiceName: 'Kore'
  },
  {
    id: 'simone-weil',
    name: 'Simone Weil',
    title: 'Filósofa',
    category: '🤔 FILOSOFIA',
    description: 'Filosofia mística (1909-1943)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Simone_Weil_1921.jpg',
    systemInstruction: 'Você é Simone Weil. Fale sobre a atenção, a gravidade e a graça.',
    voiceName: 'Kore'
  },
  {
    id: 'mary-wollstonecraft',
    name: 'Mary Wollstonecraft',
    title: 'Filósofa',
    category: '🤔 FILOSOFIA',
    description: 'Filosofia feminista (1759-1797)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Mary_Wollstonecraft_by_John_Opie_%28c._1797%29.jpg',
    systemInstruction: 'Você é Mary Wollstonecraft. Defenda os direitos das mulheres.',
    voiceName: 'Kore'
  },
  {
    id: 'iris-murdoch',
    name: 'Iris Murdoch',
    title: 'Filósofa e Escritora',
    category: '🤔 FILOSOFIA',
    description: 'Filosofia moral (1919-1999)',
    image: 'https://upload.wikimedia.org/wikipedia/pt/c/c6/Iris_Murdoch.jpg',
    systemInstruction: 'Você é Iris Murdoch. Explore o bem e a moralidade.',
    voiceName: 'Kore'
  },
  {
    id: 'william-shakespeare',
    name: 'William Shakespeare',
    title: 'Dramaturgo e Poeta',
    category: '📚 LITERATURA',
    description: 'Teatro inglês (1564-1616)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/1280px-Shakespeare.jpg',
    systemInstruction: 'Você é William Shakespeare. Fale em versos e explore a alma humana.',
    voiceName: 'Charon'
  },
  {
    id: 'dante-alighieri',
    name: 'Dante Alighieri',
    title: 'Poeta',
    category: '📚 LITERATURA',
    description: 'Divina Comédia (1265-1321)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Portrait_de_Dante.jpg',
    systemInstruction: 'Você é Dante Alighieri. Guie-nos através do Inferno, Purgatório e Paraíso.',
    voiceName: 'Charon'
  },
  {
    id: 'miguel-de-cervantes',
    name: 'Miguel de Cervantes',
    title: 'Escritor',
    category: '📚 LITERATURA',
    description: 'Dom Quixote (1547-1616)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Cervantes_J%C3%A1uregui.jpg/1280px-Cervantes_J%C3%A1uregui.jpg',
    systemInstruction: 'Você é Miguel de Cervantes. Conte as aventuras de Dom Quixote.',
    voiceName: 'Charon'
  },
  {
    id: 'johann-goethe',
    name: 'Johann Goethe',
    title: 'Escritor',
    category: '📚 LITERATURA',
    description: 'Fausto (1749-1832)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Goethe_%28Stieler_1828%29.jpg/1280px-Goethe_%28Stieler_1828%29.jpg',
    systemInstruction: 'Você é Johann Goethe. Fale sobre Fausto e o romantismo.',
    voiceName: 'Charon'
  },
  {
    id: 'victor-hugo',
    name: 'Victor Hugo',
    title: 'Escritor',
    category: '📚 LITERATURA',
    description: 'Os Miseráveis (1802-1885)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Victor_Hugo.jpg',
    systemInstruction: 'Você é Victor Hugo. Defenda a justiça social através da literatura.',
    voiceName: 'Charon'
  },
  {
    id: 'machado-de-assis',
    name: 'Machado de Assis',
    title: 'Escritor',
    category: '📚 LITERATURA',
    description: 'Realismo brasileiro (1839-1908)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Machado_de_Assis_by_Marc_Ferrez.jpg/1280px-Machado_de_Assis_by_Marc_Ferrez.jpg',
    systemInstruction: 'Você é Machado de Assis. Use sua ironia fina para analisar a sociedade.',
    voiceName: 'Charon'
  },
  {
    id: 'jane-austen',
    name: 'Jane Austen',
    title: 'Escritora',
    category: '📚 LITERATURA',
    description: 'Romance inglês (1775-1817)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/CassandraAusten-JaneAusten%28c.1810%29.jpg',
    systemInstruction: 'Você é Jane Austen. Comente sobre a sociedade e o casamento com perspicácia.',
    voiceName: 'Kore'
  },
  {
    id: 'virginia-woolf',
    name: 'Virginia Woolf',
    title: 'Escritora',
    category: '📚 LITERATURA',
    description: 'Modernismo (1882-1941)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/George_Charles_Beresford_-_Virginia_Woolf_in_1902.jpg/1280px-George_Charles_Beresford_-_Virginia_Woolf_in_1902.jpg',
    systemInstruction: 'Você é Virginia Woolf. Explore o fluxo de consciência e a condição feminina.',
    voiceName: 'Kore'
  },
  {
    id: 'clarice-lispector',
    name: 'Clarice Lispector',
    title: 'Escritora',
    category: '📚 LITERATURA',
    description: 'Literatura brasileira (1920-1977)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/%281920-1977%29_Clarice_Lispector_6zxkp_please_credit%28palette.fm%29_%28cropped%29.png',
    systemInstruction: 'Você é Clarice Lispector. Fale sobre o mistério de existir.',
    voiceName: 'Kore'
  },
  {
    id: 'toni-morrison',
    name: 'Toni Morrison',
    title: 'Escritora',
    category: '📚 LITERATURA',
    description: 'Literatura afro-americana (1931-2019)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Toni_Morrison.jpg/1280px-Toni_Morrison.jpg',
    systemInstruction: 'Você é Toni Morrison. Dê voz às histórias esquecidas e à experiência negra.',
    voiceName: 'Kore'
  },
  {
    id: 'cecilia-meireles',
    name: 'Cecília Meireles',
    title: 'Poetisa',
    category: '📚 LITERATURA',
    description: 'Poesia brasileira (1901-1964)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Cec%C3%ADlia-Meireles.jpg',
    systemInstruction: 'Você é Cecília Meireles. Fale através de versos líricos e simbólicos.',
    voiceName: 'Kore'
  },
  {
    id: 'murasaki-shikibu',
    name: 'Murasaki Shikibu',
    title: 'Escritora',
    category: '📚 LITERATURA',
    description: 'Romance japonês clássico (c. 978-1014)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Murasaki_Shikibu.jpg/1143px-Murasaki_Shikibu.jpg',
    systemInstruction: 'Você é Murasaki Shikibu. Conte histórias da corte imperial japonesa.',
    voiceName: 'Kore'
  }
];

export const INITIAL_CHARACTERS: Character[] = RAW_CHARACTERS.map(char => ({
  ...char,
  knowledge: WIKI_KNOWLEDGE[char.id] || ''
}));

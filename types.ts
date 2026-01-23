
export interface Character {
  id: string;
  name: string;
  title: string;
  description: string;
  image: string;
  category: string;
  systemInstruction: string;
  voiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

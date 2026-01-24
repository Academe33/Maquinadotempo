import React, { useState } from 'react';
import { useCharacters } from '../contexts/CharacterContext';
import { Character } from '../types';
import { Save, RefreshCw, X, Plus, Trash2 } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

const CATEGORIES = [
  '🧪 CIÊNCIA & TECNOLOGIA',
  '🧠 FILOSOFIA & PENSAMENTO',
  '🏛️ POLÍTICA & LIDERANÇA',
  '🎨 ARTES & CULTURA',
  '🌍 EXPLORAÇÃO & DESCOBERTAS GEOGRÁFICAS',
  '🧭 EMPREENDEDORISMO & INOVAÇÃO SOCIAL'
];

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { characters, updateCharacter, addCharacter, deleteCharacter, resetCharacters } = useCharacters();
  const [selectedCharId, setSelectedCharId] = useState<string | null>(characters[0]?.id || null);
  const [formData, setFormData] = useState<Partial<Character>>({});

  const selectedChar = characters.find(c => c.id === selectedCharId);
  const isEditing = !!selectedCharId && !!selectedChar;

  // Update form when selection changes
  React.useEffect(() => {
    if (selectedCharId && selectedChar) {
      setFormData({
        name: selectedChar.name,
        image: selectedChar.image,
        systemInstruction: selectedChar.systemInstruction,
        title: selectedChar.title,
        category: selectedChar.category,
        description: selectedChar.description
      });
    } else if (selectedCharId === null) {
      // New Character Mode
      setFormData({
        name: '',
        image: '',
        systemInstruction: '',
        title: '',
        category: CATEGORIES[0],
        description: ''
      });
    }
  }, [selectedCharId, characters]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.title || !formData.description) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    if (selectedCharId && isEditing) {
      updateCharacter(selectedCharId, formData);
      alert('Personagem atualizado com sucesso!');
    } else {
      // Create new character
      const newId = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const newCharacter: Character = {
        id: newId,
        name: formData.name,
        title: formData.title || '',
        description: formData.description || '',
        image: formData.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
        category: formData.category || CATEGORIES[0],
        systemInstruction: formData.systemInstruction || `Você é ${formData.name}.`,
        voiceName: 'Puck' // Default voice
      };
      
      addCharacter(newCharacter);
      setSelectedCharId(newId);
      alert('Personagem criado com sucesso!');
    }
  };

  const handleDelete = () => {
    if (selectedCharId && confirm('Tem certeza que deseja excluir este personagem?')) {
      deleteCharacter(selectedCharId);
      const remaining = characters.filter(c => c.id !== selectedCharId);
      if (remaining.length > 0) {
        setSelectedCharId(remaining[0].id);
      } else {
        setSelectedCharId(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
          <h2 className="text-3xl font-bold text-red-500">Painel Administrativo</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar - Character List */}
          <div className="md:col-span-1 border-r border-zinc-800 pr-4 h-[600px] flex flex-col">
            <h3 className="text-lg font-semibold text-zinc-400 mb-4">Personagens</h3>
            
            <button
              onClick={() => setSelectedCharId(null)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors flex items-center gap-3 mb-2 border-2 border-dashed ${
                selectedCharId === null
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/50'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="font-bold">Novo Personagem</span>
            </button>

            <div className="space-y-2 overflow-y-auto flex-1">
              {characters.map(char => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharId(char.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                    selectedCharId === char.id 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                      : 'hover:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <img src={char.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <span className="truncate">{char.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex gap-6 items-start">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-700 shrink-0 bg-zinc-900 flex items-center justify-center">
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">?</span>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Nome</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    placeholder="Nome do Personagem"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Título</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    placeholder="Ex: Físico Teórico"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Categoria</label>
              <select
                name="category"
                value={formData.category || ''}
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">URL da Foto</label>
              <input
                type="text"
                name="image"
                value={formData.image || ''}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Descrição Curta</label>
              <textarea
                name="description"
                rows={2}
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="Uma breve descrição que aparece no card..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Knowledge (System Instruction)</label>
              <p className="text-xs text-zinc-500 mb-2">Instruções para a IA sobre como o personagem deve se comportar e o que ele sabe.</p>
              <textarea
                name="systemInstruction"
                rows={6}
                value={formData.systemInstruction || ''}
                onChange={handleChange}
                placeholder="Você é..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors font-mono text-sm"
              />
            </div>

            <div className="pt-6 flex items-center justify-between border-t border-zinc-800">
              <div className="flex gap-2">
                <button
                  onClick={resetCharacters}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-500 hover:text-white transition-colors"
                  title="Restaurar personagens originais"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Resetar</span>
                </button>
                
                {isEditing && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                )}
              </div>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                {isEditing ? 'Salvar Alterações' : 'Criar Personagem'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

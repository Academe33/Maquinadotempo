import React, { useState } from 'react';
import { useCharacters } from '../contexts/CharacterContext';
import { Character } from '../types';
import { Save, RefreshCw, X } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { characters, updateCharacter, resetCharacters } = useCharacters();
  const [selectedCharId, setSelectedCharId] = useState<string>(characters[0]?.id || '');
  const [formData, setFormData] = useState<Partial<Character>>({});

  const selectedChar = characters.find(c => c.id === selectedCharId);

  // Update form when selection changes
  React.useEffect(() => {
    if (selectedChar) {
      setFormData({
        name: selectedChar.name,
        image: selectedChar.image,
        systemInstruction: selectedChar.systemInstruction,
        title: selectedChar.title,
        description: selectedChar.description
      });
    }
  }, [selectedCharId, characters]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (selectedCharId) {
      updateCharacter(selectedCharId, formData);
      alert('Personagem atualizado com sucesso!');
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
          <div className="md:col-span-1 border-r border-zinc-800 pr-4 h-[600px] overflow-y-auto">
            <h3 className="text-lg font-semibold text-zinc-400 mb-4">Selecione para Editar</h3>
            <div className="space-y-2">
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
            {selectedChar && (
              <>
                <div className="flex gap-6 items-start">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-700 shrink-0">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Nome</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleChange}
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
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">URL da Foto</label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image || ''}
                    onChange={handleChange}
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
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors font-mono text-sm"
                  />
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-zinc-800">
                  <button
                    onClick={resetCharacters}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resetar Todos
                  </button>

                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

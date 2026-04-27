import React, { useState } from 'react';
import { categorieService } from '../api/categorieService';

const CategorieForm = ({ onRefresh }) => {
  const [nom, setNom] = useState('');
  const [icone, setIcone] = useState('📦');
  const [couleur, setCouleur] = useState('#6366f1');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await categorieService.create({ nom, icone, couleur, type: 'les_deux' });
      setNom('');
      onRefresh(); // Recharge la liste dans le composant parent
    } catch (err) {
      console.error("Erreur lors de la création de la catégorie", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <input 
        value={nom} 
        onChange={(e) => setNom(e.target.value)} 
        placeholder="Nom de la catégorie" 
        className="p-2 border rounded flex-1"
        required 
      />
      <input 
        value={icone} 
        onChange={(e) => setIcone(e.target.value)} 
        placeholder="Emoji" 
        className="w-16 p-2 border rounded text-center"
      />
      <input 
        type="color"
        value={couleur}
        onChange={(e) => setCouleur(e.target.value)}
        className="h-10 w-10 border-none cursor-pointer"
      />
      <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
        + Ajouter
      </button>
    </form>
  );
};

export default CategorieForm;
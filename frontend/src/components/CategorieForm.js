// frontend/src/components/CategorieForm.js
// CORRECTION: remplacer categorieService par api direct
// pour être cohérent avec la page Categories.js et Transactions.js

/*import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CategorieForm = ({ onRefresh }) => {
  const [nom, setNom] = useState('');
  const [icone, setIcone] = useState('📦');
  const [couleur, setCouleur] = useState('#6366f1');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim()) {
      toast.error('Veuillez entrer un nom');
      return;
    }
    try {
      await api.post('/transactions/categories/', { 
        nom: nom.trim(), 
        icone: icone || '📦', 
        couleur, 
        type: 'les_deux' 
      });
      toast.success('Catégorie créée !');
      setNom('');
      setIcone('📦');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur lors de la création", err);
      toast.error(err.response?.data?.detail || 'Erreur lors de la création');
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

export default CategorieForm;*/
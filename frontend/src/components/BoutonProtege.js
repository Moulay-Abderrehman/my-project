// frontend/src/components/BoutonProtege.js
import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Bouton qui se désactive automatiquement selon le rôle ou la feature.
 *
 * Props :
 *   - roles    : string[]  — ex: ['standard', 'entreprise']
 *   - feature  : string    — ex: 'extraction_pdf'
 *   - onClick  : function  — action à exécuter si autorisé
 *   - style    : object    — styles supplémentaires
 *   - messageRefus : string — message affiché si accès refusé
 *
 * Usage :
 *   <BoutonProtege roles={['standard','entreprise']} onClick={...}>Modifier</BoutonProtege>
 *   <BoutonProtege feature="extraction_pdf" onClick={...}>Extraire PDF</BoutonProtege>
 */
export default function BoutonProtege({
  children,
  onClick,
  roles,
  feature,
  style = {},
  className = '',
  messageRefus = "Cette fonctionnalité n'est pas disponible avec votre plan actuel.",
  ...rest
}) {
  const { user, aFeature, aRole } = useAuth();

  let autorise = true;
  if (!user || user.role === 'visiteur') autorise = false;
  if (roles   && !aRole(roles))     autorise = false;
  if (feature && !aFeature(feature)) autorise = false;

  const handleClick = (e) => {
    if (!autorise) {
      alert(messageRefus);
      return;
    }
    if (onClick) onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      title={!autorise ? messageRefus : undefined}
      style={{
        cursor:  autorise ? 'pointer' : 'not-allowed',
        opacity: autorise ? 1 : 0.45,
        ...style,
      }}
      {...rest}
    >
      {!autorise && '🔒 '}{children}
    </button>
  );
}
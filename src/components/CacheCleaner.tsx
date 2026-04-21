import React, { useEffect } from 'react';

/**
 * CacheCleaner Component
 * Limpa automaticamente cache e sessionStorage para evitar problemas de autenticação
 * quando a aplicação é alterada
 */
const CacheCleaner: React.FC = () => {
  useEffect(() => {
    // Limpar cache de API antiga
    const clearStaleCache = async () => {
      try {
        // Fechar conexões pendentes
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          registrations.forEach(reg => reg.unregister());
        }
      } catch (error) {
        console.warn('Could not clear service workers:', error);
      }
    };

    // Verificar se há sessão corrompida
    const checkSessionIntegrity = () => {
      try {
        // Limpar localStorage de itens corrompidos
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          try {
            const value = localStorage.getItem(key);
            // Se o item for muito grande ou vazio, remover
            if (!value || value.length > 10000000) {
              localStorage.removeItem(key);
            }
            // Tentar parsear JSON para validar
            if (value?.startsWith('{') || value?.startsWith('[')) {
              JSON.parse(value);
            }
          } catch (e) {
            console.warn(`Corrupted localStorage item: ${key}, removing...`);
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('Could not check localStorage:', error);
      }
    };

    // Verificar integridade de sessionStorage
    const checkSessionStorage = () => {
      try {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          try {
            const value = sessionStorage.getItem(key);
            if (!value || value.length > 10000000) {
              sessionStorage.removeItem(key);
            }
          } catch (e) {
            console.warn(`Corrupted sessionStorage item: ${key}, removing...`);
            sessionStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('Could not check sessionStorage:', error);
      }
    };

    // Escutar mensagens de force refresh via localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'forceRefresh' && e.newValue === 'true') {
        console.log('Force refresh triggered, clearing cache and reloading...');
        clearAllCache();
        // Remover a flag
        localStorage.removeItem('forceRefresh');
        // Reload page
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    };

    // Executar verificações
    clearStaleCache();
    checkSessionIntegrity();
    checkSessionStorage();

    // Listener para força refresh entre tabs
    window.addEventListener('storage', handleStorageChange);

    // Limpar cache a cada 30 minutos
    const cacheCleanInterval = setInterval(() => {
      checkSessionIntegrity();
      checkSessionStorage();
    }, 30 * 60 * 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(cacheCleanInterval);
    };
  }, []);

  return null;
};

// Função global para limpar todo cache
export const clearAllCache = async () => {
  try {
    // Limpar localStorage
    localStorage.clear();
    
    // Limpar sessionStorage
    sessionStorage.clear();
    
    // Limpar cookies (exceto essential)
    document.cookie.split(';').forEach((c) => {
      const eqPos = c.indexOf('=');
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
      if (name && !['sb-access-token', 'sb-refresh-token'].includes(name)) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
      }
    });

    // Limpar IndexedDB
    const dbs = await window.indexedDB.databases?.() || [];
    dbs.forEach(db => {
      if (db.name) {
        window.indexedDB.deleteDatabase(db.name);
      }
    });

    console.log('✅ Cache limpo completamente');
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
  }
};

// Função para força refresh em todos os tabs
export const triggerForceRefresh = () => {
  localStorage.setItem('forceRefresh', 'true');
};

export default CacheCleaner;

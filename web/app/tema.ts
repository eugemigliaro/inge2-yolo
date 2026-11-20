// Va aparte del componente cliente: una constante exportada desde 'use client' llega al servidor como referencia, no como texto.
export const CLAVE_TEMA = 'theme';

// Corre en <head> antes de pintar, para que la página no parpadee en claro al cargar en oscuro.
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem('${CLAVE_TEMA}')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

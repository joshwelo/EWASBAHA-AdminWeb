// Test environment variable loading
console.log('=== ENVIRONMENT VARIABLE TEST ===');
console.log('import.meta.env:', import.meta.env);
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('All VITE_ variables:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
console.log('=== END TEST ==='); 
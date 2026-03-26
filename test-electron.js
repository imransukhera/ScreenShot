console.log('process.type:', process.type);
console.log('process.versions.electron:', process.versions.electron);
// Try requiring electron API differently
try {
  const e = process._linkedBinding ? process._linkedBinding('electron_common_v8_util') : null;
  console.log('linkedBinding:', e ? 'works' : null);
} catch(err) { console.log('linkedBinding err:', err.message); }
// Check if electron built-in exists
const Module = require('module');
console.log('builtins include electron:', Module.builtinModules ? Module.builtinModules.includes('electron') : 'no builtinModules');

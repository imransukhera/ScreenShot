// DIAGNOSTIC - FIRST LINE
process.stdout.write('PROCESS TYPE AT START: ' + process.type + '\n');
process.stdout.write('ELECTRON VERSION: ' + (process.versions && process.versions.electron) + '\n');
// Now try requiring electron
const electronModule = require('electron');
process.stdout.write('ELECTRON MODULE TYPE: ' + typeof electronModule + '\n');
process.stdout.write('ELECTRON MODULE: ' + JSON.stringify(
  typeof electronModule === 'object' ? Object.keys(electronModule || {}).slice(0,5) : String(electronModule).slice(0,100)
) + '\n');

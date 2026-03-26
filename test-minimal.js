// Try all process properties that electron sets
const electronProps = ['type', 'defaultApp', 'isMainFrame', 'sandboxed', 'contextId', 'guestInstanceId', 'helpersPath', 'resourcesPath', 'mas', 'windowsStore'];
electronProps.forEach(p => console.log(p+':', process[p]));
// Try accessing via process._linkedBinding which is how electron exposes native APIs
try {
  const v8util = process._linkedBinding('electron_common_v8_util');
  console.log('v8util:', Object.keys(v8util||{}).slice(0,5));
} catch(e) { console.log('v8util err:', e.message.slice(0,60)); }

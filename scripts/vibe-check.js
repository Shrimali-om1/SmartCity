const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('Running Vibe Check...');
const checks = [
    { name: 'Root package.json', path: 'package.json' },
    { name: 'Root .gitignore', path: '.gitignore' },
    { name: 'Backend folder', path: 'backend' },
    { name: 'Backend server.js', path: 'backend/server.js' },
    { name: 'App Governance folder', path: 'app-governance' },
    { name: 'App Traffic folder', path: 'app-traffic' },
];

let allPassed = true;

for (const check of checks) {
    const fullPath = path.join(__dirname, '..', check.path);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${check.name} exists.`);
    } else {
        console.error(`❌ ${check.name} does NOT exist.`);
        allPassed = false;
    }
}

if (!allPassed) {
    console.log('🚧 Vibe check failed due to missing files/folders.');
    process.exit(1);
}

console.log('✅ All folders and essential files are present.');
console.log('🚀 Checking backend startup...');

const backendProcess = exec('npm start', { cwd: path.join(__dirname, '..', 'backend') });
let backendStarted = false;

backendProcess.stdout.on('data', (data) => {
    if (data.includes('Server is running')) {
        backendStarted = true;
        console.log('✅ Backend started successfully!');
        backendProcess.kill();
        console.log('🎯 VIBE CHECK PASSED.');
        process.exit(0);
    }
});

backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
});

setTimeout(() => {
    if (!backendStarted) {
        console.error('❌ Backend did not start within 10 seconds.');
        backendProcess.kill();
        process.exit(1);
    }
}, 10000);

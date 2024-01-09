const fs = require('fs');
const path = require('path');

const folderPath = path.join(__dirname, 'public');
const filePath1 = path.join(folderPath, 'bars.json');
const filePath2 = path.join(folderPath, 'bars2.json');
const filePath3 = path.join(folderPath, 'master.json');
const filePath4 = path.join(folderPath, 'backtester.json');

// Check if folder exists, if not, create it
if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
}

// Create data.json with initial content inside the folder
fs.writeFileSync(filePath1, '[]', 'utf8', (err) => {
    if (err) throw err;
    console.log('data.json file has been created inside dataFolder!');
});

fs.writeFileSync(filePath2, '[]', 'utf8', (err) => {
    if (err) throw err;
    console.log('data.json file has been created inside dataFolder!');
});

fs.writeFileSync(filePath3, '[]', 'utf8', (err) => {
    if (err) throw err;
    console.log('data.json file has been created inside dataFolder!');
});

fs.writeFileSync(filePath4, '[]', 'utf8', (err) => {
    if (err) throw err;
    console.log('data.json file has been created inside dataFolder!');
});
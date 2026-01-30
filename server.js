const express = require('express');
const fs = require('fs'); // The "File System" tool
const app = express();
app.get('/', (req, res) => {
    res.redirect('/home');
});
const port = 3000;

app.use(express.urlencoded({ extended: true }));

// Function to read data from the file
const getSavedMoods = () => {
    try {
        const data = fs.readFileSync('moods.json');
        return JSON.parse(data);
    } catch (error) {
        return []; // Return empty list if file doesn't exist yet
    }
};

app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/moods', (req, res) => {
    const moods = getSavedMoods();
    
    // Logic: Count how many times each mood appears
    const stats = {};
    moods.forEach(m => {
        stats[m.mood] = (stats[m.mood] || 0) + 1;
    });

    // Create "Stat Badges" for the top of the page
    const statsHtml = Object.entries(stats).map(([name, count]) => `
        <div style="background: #e2e8f0; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; color: #4a5568;">
            ${name}: ${count}
        </div>
    `).join('');

    const listItems = moods.map(m => `
        <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <small style="color: #a0aec0;">${m.date}</small>
            <h3 style="margin: 5px 0; color: #4a90e2;">${m.mood}</h3>
            <p style="margin: 0; color: #4a5568;">${m.note}</p>
        </div>
    `).reverse().join(''); // .reverse() shows newest moods first!

    res.send(`
        <body style="font-family: sans-serif; background-color: #f0f4f8; padding: 40px; display: flex; justify-content: center;">
            <div style="width: 100%; max-width: 500px;">
                <h1 style="color: #2d3748; margin-bottom: 5px;">Mood Dashboard</h1>
                <div style="display: flex; gap: 10px; margin-bottom: 25px; flex-wrap: wrap;">
                    ${statsHtml}
                </div>
                ${listItems}
                <a href="/home" style="display: block; margin-top: 20px; color: #4a90e2; text-decoration: none; font-weight: bold;">+ Add New Entry</a>
            </div>
        </body>
    `);
});
app.post('/add-mood', (req, res) => {
    const moods = getSavedMoods();
    const newEntry = {
        date: new Date().toLocaleDateString(),
        mood: req.body.mood,
        note: req.body.note
    };
    
    moods.push(newEntry);
    
    // This line saves the list to your hard drive!
    fs.writeFileSync('moods.json', JSON.stringify(moods, null, 2));
    
    res.send('<h1>Mood Saved Forever!</h1><a href="/home">Go Back</a> | <a href="/moods">View History</a>');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
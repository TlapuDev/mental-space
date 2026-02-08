const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

function getSavedMoods() {
    if (!fs.existsSync('moods.json')) return [];
    const data = fs.readFileSync('moods.json');
    return JSON.parse(data);
}

// 1. HOME PAGE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. VIEW HISTORY PAGE (The Card Design)
app.get('/moods', (req, res) => {
    const moods = getSavedMoods();
    const listItems = moods.map((m, index) => `
        <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 5px solid ${m.stressScore > 7 ? '#ff7675' : '#6c5ce7'};">
            <small style="color: #a0aec0; font-weight: bold;">${m.date}</small>
            <h3 style="margin: 5px 0; color: #2d3748;">${m.mood} (Stress: ${m.stressScore || 0}/10)</h3>
            <p style="margin: 0; color: #4a5568;">"${m.note}"</p>
            <form action="/delete-mood" method="POST" style="margin-top: 10px;">
                <input type="hidden" name="index" value="${index}">
                <button type="submit" style="background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2; padding: 5px 10px; border-radius: 8px; cursor: pointer;">Delete</button>
            </form>
        </div>
    `).reverse().join('');

    res.send(`
        <html>
        <head><title>History</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="font-family: sans-serif; background: #f5f7fa; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <a href="/" style="text-decoration: none; color: #6c5ce7; font-weight: bold;">← Back</a>
                <h1>Your History (${moods.length})</h1>
                ${listItems}
            </div>
        </body>
        </html>
    `);
});

// 3. SAVE MOOD (The Modern Success Page)
app.post('/add-mood', (req, res) => {
    const moods = getSavedMoods();
    const newEntry = {
        mood: req.body.mood,
        note: req.body.note,
        stressScore: req.body.stressScore,
        date: new Date().toLocaleString()
    };
    moods.push(newEntry);
    fs.writeFileSync('moods.json', JSON.stringify(moods, null, 2));

    res.send(`
        <html>
        <body style="font-family: sans-serif; background: linear-gradient(135deg, #6c5ce7, #a8c0ff); color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center;">
            <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
                <h1>✅ Logged Successfully!</h1>
                <p>Your reflection is safe.</p>
                <div style="margin-top: 20px;">
                    <a href="/" style="background: white; color: #6c5ce7; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-weight: bold; margin-right: 10px;">Add More</a>
                    <a href="/moods" style="color: white; text-decoration: underline;">View History</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// 4. DELETE MOOD
app.post('/delete-mood', (req, res) => {
    const indexToDelete = req.body.index;
    let moods = getSavedMoods();
    moods.splice(indexToDelete, 1);
    fs.writeFileSync('moods.json', JSON.stringify(moods, null, 2));
    res.redirect('/moods');
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
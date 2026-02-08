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

// --- SHARED STYLE COMPONENT ---
const sharedHead = `
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); margin: 0; padding: 20px; min-height: 100vh; color: #2d3748; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
        .brand-header { text-align: center; margin-bottom: 30px; }
        .brand-name { color: #6c5ce7; margin: 0; font-size: 2rem; font-weight: 800; }
        .tagline { color: #718096; font-size: 0.9rem; margin-top: 5px; }
        .card { background: #fff; border: 1px solid #edf2f7; padding: 20px; border-radius: 20px; margin-bottom: 15px; position: relative; transition: 0.3s; }
        .btn-primary { background: #6c5ce7; color: white; padding: 12px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; display: inline-block; border: none; cursor: pointer; }
    </style>
`;

// 1. HOME PAGE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. VIEW HISTORY PAGE
app.get('/moods', (req, res) => {
    const moods = getSavedMoods();
    const listItems = moods.map((m, index) => `
        <div class="card" style="border-left: 6px solid ${m.stressScore > 7 ? '#ff7675' : '#6c5ce7'};">
            <small style="color: #a0aec0; font-weight: bold;">${m.date}</small>
            <h3 style="margin: 10px 0; display: flex; align-items: center; gap: 10px;">
                ${m.mood} 
                <span style="font-size: 0.7rem; background: ${m.stressScore > 7 ? '#ff7675' : '#6c5ce7'}; color: white; padding: 3px 10px; border-radius: 20px;">Stress: ${m.stressScore || 0}/10</span>
            </h3>
            <p style="color: #4a5568; font-style: italic; margin-bottom: 15px;">"${m.note}"</p>
            <form action="/delete-mood" method="POST" style="margin: 0;">
                <input type="hidden" name="index" value="${index}">
                <button type="submit" style="background: none; color: #ff7675; border: none; cursor: pointer; font-size: 0.8rem; font-weight: bold;">Delete Entry</button>
            </form>
        </div>
    `).reverse().join('');

    res.send(`
        <html>
        <head><title>History | MentalSpace</title>${sharedHead}</head>
        <body>
            <div class="container">
                <div class="brand-header">
                    <h1 class="brand-name">MentalSpace</h1>
                    <p class="tagline">Your safe space for mental clarity</p>
                </div>
                <a href="/" style="display: block; margin-bottom: 20px; color: #6c5ce7; text-decoration: none; font-weight: bold;">← Back to Tracker</a>
                <div style="background: #f8fafc; padding: 15px; border-radius: 15px; margin-bottom: 25px; text-align: center;">
                    <span style="color: #718096;">Total Reflections: </span><strong>${moods.length}</strong>
                </div>
                ${listItems}
            </div>
        </body>
        </html>
    `);
});

// 3. SUCCESS PAGE
app.post('/add-mood', (req, res) => {
    const moods = getSavedMoods();
    const newEntry = {
        mood: req.body.mood,
        note: req.body.note,
        stressScore: req.body.stressScore,
        date: new Date().toLocaleDateString()
    };
    moods.push(newEntry);
    fs.writeFileSync('moods.json', JSON.stringify(moods, null, 2));

    res.send(`
        <html>
        <head><title>Success | MentalSpace</title>${sharedHead}</head>
        <body style="display: flex; align-items: center; justify-content: center;">
            <div class="container" style="text-align: center;">
                <div style="font-size: 60px; margin-bottom: 20px;">🌿</div>
                <h1 class="brand-name">Reflection Saved</h1>
                <p style="color: #718096; margin-bottom: 30px;">Take a deep breath. You are doing great.</p>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <a href="/" class="btn-primary">Add Another Entry</a>
                    <a href="/moods" style="color: #6c5ce7; text-decoration: none; font-weight: bold; margin-top: 10px;">View Your Journey</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// 4. DELETE MOOD
app.post('/delete-mood', (req, res) => {
    let moods = getSavedMoods();
    moods.splice(req.body.index, 1);
    fs.writeFileSync('moods.json', JSON.stringify(moods, null, 2));
    res.redirect('/moods');
});

app.listen(PORT, () => console.log('Server running!'));
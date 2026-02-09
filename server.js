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

// SHARED BRANDING AND STYLE
const brandStyles = `
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; margin: 0; padding: 20px; color: #1a202c; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .brand-name { color: #6c5ce7; font-size: 2.5rem; font-weight: 800; margin: 0; }
        .tagline { color: #4a5568; font-style: italic; font-size: 1rem; margin-top: 5px; }
        .card { background: white; padding: 20px; border-radius: 15px; margin-bottom: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); position: relative; border-left: 5px solid #6c5ce7; }
        .intensity-badge { font-size: 0.75rem; background: #6c5ce7; color: white; padding: 3px 10px; border-radius: 20px; margin-left: 10px; }
        .delete-btn { background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: bold; }
    </style>
`;

// 1. LANDING PAGE (The "Front Door")
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'welcome.html'));
});

// 2. THE TRACKER (The form where you log moods)
app.get('/tracker', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. VIEW HISTORY (With "Intensity" Label)
app.get('/moods', (req, res) => {
    const moods = getSavedMoods();
    const listItems = moods.map((m, index) => `
        <div class="card" style="border-left-color: ${m.stressScore > 7 ? '#ff7675' : '#6c5ce7'};">
            <small style="color: #a0aec0;">${m.date}</small>
            <h3 style="margin: 10px 0;">${m.mood} <span class="intensity-badge" style="background:${m.stressScore > 7 ? '#ff7675' : '#6c5ce7'};">Intensity: ${m.stressScore || 0}/10</span></h3>
            <p style="color: #4a5568; margin-bottom: 15px;">"${m.note}"</p>
            <form action="/delete-mood" method="POST" onsubmit="return confirm('Are you sure you want to delete this reflection? This cannot be undone.');">
                <input type="hidden" name="index" value="${index}">
                <button type="submit" class="delete-btn">Delete</button>
            </form>
        </div>
    `).reverse().join('');

    res.send(`
        <html>
        <head><title>History | MentalSpace</title>${brandStyles}</head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="brand-name">MentalSpace</h1>
                    <p class="tagline">A DigitalSpace For a Healthier Mind</p>
                </div>
                <a href="/tracker" style="color: #6c5ce7; text-decoration: none; font-weight: bold; display: block; margin-bottom: 20px;">← Back to Tracker</a>
                <h2 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Your Journey (${moods.length})</h2>
                ${listItems}
            </div>
        </body>
        </html>
    `);
});

// 4. SAVE MOOD
app.post('/add-mood', (req, res) => {
    const moods = getSavedMoods();
    moods.push({ 
        mood: req.body.mood, 
        note: req.body.note, 
        stressScore: req.body.stressScore, 
        date: new Date().toLocaleString() 
    });
    fs.writeFileSync('moods.json', JSON.stringify(moods, null, 2));
    res.send(`
        <html>
        <head>${brandStyles}</head>
        <body style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #6c5ce7;">
            <div class="card" style="text-align: center; width: 100%; max-width: 400px; border: none;">
                <h1 style="color: #6c5ce7;">Saved Successfully!</h1>
                <p>Well done on reflecting today.</p>
                <a href="/tracker" style="background: #6c5ce7; color: white; padding: 10px 20px; border-radius: 10px; text-decoration: none; display: inline-block; margin-top: 10px;">Add Another</a>
                <br><br>
                <a href="/moods" style="color: #6c5ce7;">View History</a>
            </div>
        </body>
        </html>
    `);
});

// 5. DELETE MOOD (Safety Popup is already in the HTML form above)
app.post('/delete-mood', (req, res) => {
    let moods = getSavedMoods();
    moods.splice(req.body.index, 1);
    fs.writeFileSync('moods.json', JSON.stringify(moods, null, 2));
    res.redirect('/moods');
});

app.listen(PORT, () => console.log('MentalSpace Server Active'));
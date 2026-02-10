const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- DATA HELPERS ---
function getSavedMoods() {
    if (!fs.existsSync('moods.json')) return [];
    const data = fs.readFileSync('moods.json');
    return JSON.parse(data);
}

function getUser() {
    if (!fs.existsSync('user.json')) {
        return { id: "user_001", name: "Founder" };
    }
    const data = fs.readFileSync('user.json');
    return JSON.parse(data);
}

const brandStyles = `
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; margin: 0; padding: 20px; color: #1a202c; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .brand-name { color: #6c5ce7; font-size: 2.5rem; font-weight: 800; margin: 0; }
        .tagline { color: #4a5568; font-style: italic; font-size: 1rem; margin-top: 5px; }
        .user-greeting { color: #6c5ce7; font-weight: 600; margin-top: 10px; font-size: 1.1rem; }
        .card { background: white; padding: 20px; border-radius: 15px; margin-bottom: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); position: relative; border-left: 5px solid #6c5ce7; }
        .intensity-badge { font-size: 0.75rem; background: #6c5ce7; color: white; padding: 3px 10px; border-radius: 20px; margin-left: 10px; }
        .delete-btn { background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: bold; }
    </style>
`;

// --- ROUTES ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'welcome.html'));
});

app.get('/tracker', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. VIEW HISTORY (Fixed Header)
app.get('/moods', (req, res) => {
    const moods = getSavedMoods();
    const user = getUser();
    const listItems = moods.map((m, index) => `
        <div class="card" style="border-left-color: ${m.stressScore > 7 ? '#ff7675' : '#6c5ce7'};">
            <small style="color: #a0aec0;">${m.date}</small>
            <h3 style="margin: 10px 0;">${m.mood} <span class="intensity-badge" style="background:${m.stressScore > 7 ? '#ff7675' : '#6c5ce7'};">Intensity: ${m.stressScore || 0}/10</span></h3>
            <p style="color: #4a5568; margin-bottom: 15px;">"${m.note}"</p>
            <form action="/delete-mood" method="POST" onsubmit="return confirm('Are you sure?');">
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
                    <div class="user-greeting">Welcome back, ${user.name}</div>
                </div>
                <a href="/tracker" style="color: #6c5ce7; text-decoration: none; font-weight: bold; display: block; margin-bottom: 20px;">← Back to Tracker</a>
                <h2 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">${user.name}'s Journey (${moods.length})</h2>
                ${listItems}
            </div>
        </body>
        </html>
    `);
});

app.post('/add-mood', (req, res) => {
    const moods = getSavedMoods();
    const user = getUser();
    moods.push({ userId: user.id, mood: req.body.mood, note: req.body.note, stressScore: req.body.stressScore, date: new Date().toLocaleString() });
    fs.writeFileSync('moods.json', JSON.stringify(moods, null, 2));
    res.redirect('/moods');
});

app.post('/delete-mood', (req, res) => {
    let moods = getSavedMoods();
    moods.splice(req.body.index, 1);
    fs.writeFileSync('moods.json', JSON.stringify(moods, null, 2));
    res.redirect('/moods');
});

app.listen(PORT, () => console.log('MentalSpace Active'));
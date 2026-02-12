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
    try {
        return JSON.parse(fs.readFileSync('moods.json'));
    } catch (e) { return []; }
}

function getUser() {
    if (!fs.existsSync('user.json')) return { id: "user_001", name: "Founder" };
    return JSON.parse(fs.readFileSync('user.json'));
}

function getCompanionNote(latestNote, intensity) {
    const note = (latestNote || "").toLowerCase();
    const score = parseInt(intensity || 0);
    if (score > 7) {
        if (note.includes('alone') || note.includes('space')) return "Phemelo, I see you need some space. It's okay to retreat to recharge.";
        if (note.includes('work') || note.includes('pressure')) return "The pressure is high. Try the 4-7-8 breathing technique for 1 minute.";
        return "You're in a high-intensity zone. Please be extra kind to yourself today.";
    }
    return "Keep reflecting. Every note is a step toward understanding your mind.";
}

const brandStyles = `
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; margin: 0; padding: 20px; color: #1a202c; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .brand-name { color: #6c5ce7; font-size: 2.5rem; font-weight: 800; margin: 0; }
        .user-greeting { color: #6c5ce7; font-weight: 600; margin-top: 10px; }
        .companion-box { background: white; border-left: 8px solid #a29bfe; padding: 20px; border-radius: 15px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .chart-container { background: white; padding: 20px; border-radius: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 20px; border-radius: 15px; margin-bottom: 15px; border-left: 5px solid #6c5ce7; }
        .nav-links { margin-bottom: 20px; display: flex; gap: 15px; justify-content: center; }
        .nav-links a { color: #6c5ce7; text-decoration: none; font-weight: bold; }
        .delete-btn { background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2; padding: 6px 12px; border-radius: 8px; cursor: pointer; }
    </style>
`;

// --- THE FIXED ROUTES ---

// 1. LANDING PAGE (The Root URL)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'welcome.html'));
});

// 2. THE TRACKER (Where you log moods)
app.get('/tracker', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. THE INSIGHTS (The Chart & Companion)
app.get('/moods', (req, res) => {
    const moods = getSavedMoods();
    const user = getUser();
    const recentMoods = moods.slice(-7);
    const latestEntry = moods[moods.length - 1] || { note: "", stressScore: 0 };
    const companionAdvice = getCompanionNote(latestEntry.note, latestEntry.stressScore);

    const labels = recentMoods.map(m => m.date ? m.date.split(',')[0] : "Date"); 
    const dataPoints = recentMoods.map(m => m.stressScore || 0);

    const listItems = moods.map((m, index) => `
        <div class="card" style="border-left-color: ${m.stressScore > 7 ? '#ff7675' : '#6c5ce7'};">
            <small style="color: #a0aec0;">${m.date}</small>
            <h3 style="margin: 10px 0;">${m.mood} <span style="font-size:0.8rem; background:#6c5ce7; color:white; padding:3px 8px; border-radius:10px;">${m.stressScore}/10</span></h3>
            <p>"${m.note}"</p>
            <form action="/delete-mood" method="POST"><input type="hidden" name="index" value="${index}"><button type="submit" class="delete-btn">Delete</button></form>
        </div>
    `).reverse().join('');

    res.send(`
        <html>
        <head><title>Insights | MentalSpace</title>${brandStyles}</head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="brand-name">MentalSpace</h1>
                    <div class="user-greeting">Welcome back, ${user.name}</div>
                </div>

                <div class="nav-links">
                    <a href="/">🏠 Home</a>
                    <a href="/tracker">✍️ Log Mood</a>
                </div>

                <div class="companion-box">
                    <small style="color:#6c5ce7; font-weight:bold; text-transform:uppercase;">Companion Insight</small>
                    <p style="margin:10px 0 0; font-style: italic; color: #4a5568;">"${companionAdvice}"</p>
                </div>

                <div class="chart-container">
                    <canvas id="moodChart"></canvas>
                </div>
                ${listItems}
            </div>
            <script>
                const ctx = document.getElementById('moodChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ${JSON.stringify(labels)},
                        datasets: [{
                            label: 'Intensity',
                            data: ${JSON.stringify(dataPoints)},
                            borderColor: '#6c5ce7',
                            backgroundColor: 'rgba(108, 92, 231, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: { scales: { y: { beginAtZero: true, max: 10 } } }
                });
            </script>
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

app.listen(PORT, () => console.log('MentalSpace Fully Synchronized'));
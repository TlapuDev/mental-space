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
    return JSON.parse(fs.readFileSync('moods.json'));
}

function getUser() {
    if (!fs.existsSync('user.json')) return { id: "user_001", name: "Founder" };
    return JSON.parse(fs.readFileSync('user.json'));
}

const brandStyles = `
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; margin: 0; padding: 20px; color: #1a202c; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .brand-name { color: #6c5ce7; font-size: 2.5rem; font-weight: 800; margin: 0; }
        .tagline { color: #4a5568; font-style: italic; font-size: 1rem; margin-top: 5px; }
        .user-greeting { color: #6c5ce7; font-weight: 600; margin-top: 10px; font-size: 1.1rem; }
        
        .snapshot-card { background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%); color: white; padding: 25px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(108, 92, 231, 0.2); }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
        .stat-box { background: rgba(255,255,255,0.2); padding: 15px; border-radius: 12px; text-align: center; }
        .stat-value { font-size: 1.5rem; font-weight: bold; display: block; }
        .stat-label { font-size: 0.8rem; opacity: 0.9; text-transform: uppercase; }

        .chart-container { background: white; padding: 20px; border-radius: 20px; margin-bottom: 30px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        
        .card { background: white; padding: 20px; border-radius: 15px; margin-bottom: 15px; border-left: 5px solid #6c5ce7; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .intensity-badge { font-size: 0.75rem; background: #6c5ce7; color: white; padding: 3px 10px; border-radius: 20px; margin-left: 10px; }
        .delete-btn { background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: bold; }
    </style>
`;

// --- ROUTES ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'welcome.html')));
app.get('/tracker', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/moods', (req, res) => {
    const moods = getSavedMoods();
    const user = getUser();
    const recentMoods = moods.slice(-7);
    
    // PHASE 2 MATH: Calculate Weekly Insight
    const avgIntensity = recentMoods.length > 0 
        ? (recentMoods.reduce((sum, m) => sum + parseInt(m.stressScore || 0), 0) / recentMoods.length).toFixed(1)
        : 0;
    
    let insightMsg = "Start tracking to see patterns.";
    if (avgIntensity > 7) insightMsg = "You've been under high pressure lately. Take it slow.";
    else if (avgIntensity > 4) insightMsg = "You're navigating some waves. Keep reflecting.";
    else if (recentMoods.length > 0) insightMsg = "You're finding your flow. Maintain this clarity.";

    // Prepare Data for Chart
    const labels = recentMoods.map(m => m.date.split(',')[0]); 
    const dataPoints = recentMoods.map(m => m.stressScore || 0);

    const listItems = moods.map((m, index) => `
        <div class="card" style="border-left-color: ${m.stressScore > 7 ? '#ff7675' : '#6c5ce7'};">
            <small style="color: #a0aec0;">${m.date}</small>
            <h3 style="margin: 10px 0;">${m.mood} <span class="intensity-badge">Intensity: ${m.stressScore}/10</span></h3>
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
                    <p class="tagline">A DigitalSpace For a Healthier Mind</p>
                    <div class="user-greeting">Welcome back, ${user.name}</div>
                </div>

                <div class="snapshot-card">
                    <h3 style="margin: 0; font-size: 1.2rem;">Weekly Snapshot</h3>
                    <p style="margin: 5px 0 15px; font-size: 0.9rem; opacity: 0.9;">${insightMsg}</p>
                    <div class="stat-grid">
                        <div class="stat-box">
                            <span class="stat-value">${avgIntensity}/10</span>
                            <span class="stat-label">Avg Intensity</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-value">${moods.length}</span>
                            <span class="stat-label">Total Reflections</span>
                        </div>
                    </div>
                </div>

                <div class="chart-container">
                    <h3 style="margin-top:0; color:#4a5568; font-size: 1.1rem;">Intensity Trends (Last 7)</h3>
                    <canvas id="moodChart"></canvas>
                </div>

                <a href="/tracker" style="color: #6c5ce7; text-decoration: none; font-weight: bold; display: block; margin-bottom: 20px;">← Back to Tracker</a>
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
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: ${JSON.stringify(dataPoints.map(v => v > 7 ? '#ff7675' : '#6c5ce7'))}
                        }]
                    },
                    options: {
                        scales: { y: { beginAtZero: true, max: 10 } },
                        plugins: { legend: { display: false } }
                    }
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

app.listen(PORT, () => console.log('MentalSpace Phase 2.1 Active'));
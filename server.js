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

    const listItems = moods.map((m, index) => `
    <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 10px; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
        <div>
            <small style="color: #a0aec0;">${m.date}</small>
            <h3 style="margin: 5px 0; color: #4a90e2;">${m.mood}</h3>
            <p style="margin: 0; color: #4a5568;">${m.note}</p>
        </div>
        <form action="/delete-mood" method="POST" style="margin: 0;">
            <input type="hidden" name="index" value="${index}">
            <button type="submit" style="background: #ff7675; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">Delete</button>
        </form>
    </div>
`).reverse().join(''); // .reverse() shows newest moods first!
res.send(`
        <body style="font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #a8c0ff, #3f2b96); min-height: 100vh; margin: 0; padding: 40px; display: flex; flex-direction: column; align-items: center;">
            <div style="background: white; padding: 2.5rem; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); width: 90%; max-width: 600px;">
                <header style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #6c5ce7; margin: 0; font-size: 2.2rem;">MentalSpace History</h1>
                    <p style="font-style: italic; color: #636e72; margin-bottom: 15px;">A DigitalSpace For a Healthier Mind</p>
                    <a href="/home" style="color: #6c5ce7; text-decoration: none; font-weight: bold;">← Back to Home</a>
                </header>
                
                <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 25px;">
                    ${statsHtml}
                </div>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

                <div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                    ${listItems}
                </div>
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
app.post('/delete-mood', (req, res) => {
    const indexToDelete = req.body.index;
    let moods = getSavedMoods();
    
    // Remove the item at that specific position
    moods.splice(indexToDelete, 1);
    
    // Save the updated list back to the file
    const fs = require('fs');
    fs.writeFileSync('moods.json', JSON.stringify(moods, null, 2));
    
    res.redirect('/moods');
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
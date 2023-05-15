// Express
const express = require('express');
const app = express();
require('dotenv').config();

// OpenAI
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
 apiKey: process.env.API_KEY
});
const openai = new OpenAIApi(configuration);

const path = require('path');

const port = process.env.PORT || 3000;

// Define route for generating text
app.get('/generate-text', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked'
  });
  // Get prompt from query string
  const prompt = req.query.prompt || 'Hello, what is your name?';
  console.log(prompt);
  // Set up GPT-3.5 parameters
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    temperature: 1,
    max_tokens: 2048,
    messages: [{role: "user", content: prompt}],
    stream: true
  }, { responseType: 'stream' });
  
  completion.data.on('data', data => {
    const lines = data.toString().split('\n').filter(line => line.trim() !== '');
    for (const line of lines) {
        const message = line.replace(/^data: /, '');
        if (message === '[DONE]') {
          res.end();
          return; // Stream finished
        }
        try {
          const parsed = JSON.parse(message);
          res.write(parsed.choices[0].delta.content);
        } catch(error) {
          //console.error('Could not JSON parse stream message', message, error);
        }
    }
  });
});

// Serve HTML file
app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
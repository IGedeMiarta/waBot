import express from "express";
import {Configuration,OpenAIApi} from "openai";
import bodyParser from 'body-parser';
import 'dotenv/config';
import axios from "axios";

const app = express();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended:true}));

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const conversationContextPrompt = "Kamu Adalah Asisten AI yang dibuat oleh OpenAi, kamu bersahabat, pintar dan dapat diandalkan.";

app.get('/',(req,res)=>{
    res.send('hello chat-bot');
});
app.post('/wa-send', async (req, res) => {
  const message = req.body.message + ", jawab dengan bahasa indonesia!";
  const number = req.body.phone;
  const data = {
    api_key: process.env.WA_API_KEY, // isi api key di menu profile -> setting
    sender: process.env.WA_SENDER, // isi no device yang telah di scan
    number: number, // isi no pengirim
    message: message, // isi pesan
  };

  try {
    // Kirim permintaan POST menggunakan Axios
    const response = await axios.post('https://wa.srv5.wapanels.com/send-message', data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Tanggapi dengan respons yang diterima dari server WhatsApp
    console.log(response);
    res.json(response);
  } catch (error) {
    // Tanggapi jika terjadi kesalahan dalam permintaan
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.post('/ask', (req, res) => {
  // Extracting the user's message from the request body
  const message = req.body.message;

  // Calling the OpenAI API to complete the message
  openai.createCompletion({
    model: "text-davinci-003",
    // Adding the conversation context to the message being sent
    prompt: conversationContextPrompt + message,
    temperature: 0.9,
    max_tokens: 150,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0.6,
    stop: [" Human:", " AI:"],
  })
  .then((response) => {
    // Sending the response data back to the client
    // console.log(response.data.choices[0].text);
    const sendWa = {
      api_key: process.env.WA_API_KEY, // isi api key di menu profile -> setting
      sender: process.env.WA_SENDER, // isi no device yang telah di scan
      number: 6281529963914, // isi no penerima
      message: response.data.choices[0].text, // isi pesan
    };
    axios.post('https://wa.srv5.wapanels.com/send-message', sendWa, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    res.send(response.data.choices[0].text);

  });
});

app.listen(3000, () => {
  console.log('Conversational AI assistant listening on port 3000!');
});
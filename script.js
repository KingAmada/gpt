document.getElementById('recordBtn').addEventListener('click', startRecording);

async function startRecording() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = async (event) => {
        const speechResult = event.results[0][0].transcript;
        console.log('Speech recognized: ', speechResult);
        const responseElement = document.createElement('div');
        responseElement.textContent = `You: ${speechResult}`;
        document.getElementById('responses').appendChild(responseElement);

        const chatResponse = await getChatGPTResponse(speechResult);
        await playAudioResponse(chatResponse);
    };

    recognition.onspeechend = () => {
        recognition.stop();
    };

    recognition.onerror = (event) => {
        console.error('Error occurred in recognition: ', event.error);
    };
}

async function getChatGPTResponse(inputText) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer YOUR_OPENAI_API_KEY`
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [{ role: "user", content: inputText }],
            stream: true
        })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let chatResponse = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chatResponse += decoder.decode(value);
        const responseElement = document.createElement('div');
        responseElement.textContent = `ChatGPT: ${chatResponse}`;
        document.getElementById('responses').appendChild(responseElement);
    }

    return chatResponse;
}

async function playAudioResponse(text) {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer YOUR_OPENAI_API_KEY`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "whisper-1",
            input: text
        })
    });

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
}

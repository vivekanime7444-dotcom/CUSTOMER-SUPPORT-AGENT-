const messages = [
  "Hello",
  "What products does NOVA MART sell?",
  "What is your refund policy?",
  "I want to cancel my order",
  "Tell me about laptops",
  "What are your warranty terms?",
  "Hello again"
];

async function runTests() {
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    console.log(`\n--- Test ${i + 1}: "${msg}" ---`);
    
    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      
      const data = await response.json();
      console.log(`Status: ${response.status}`);
      if (response.ok) {
        console.log(`Success! Reply: ${data.reply.substring(0, 50)}...`);
      } else {
        console.log(`Failure! Error: ${data.error}`);
      }
    } catch (err) {
      console.error(`Network Error: ${err.message}`);
    }

    // Wait a bit before next request to mimic human timing somewhat and avoid spamming
    await new Promise(r => setTimeout(r, 2000));
  }
}

runTests();

const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({});

async function list() {
  const models = await ai.models.list();
  for await (const m of models) {
    console.log(m.name);
  }
}
list().catch(console.error);

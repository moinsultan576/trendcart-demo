// Reports only booleans — never key values.
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  const gemini = !!process.env.GEMINI_API_KEY;
  const groq = !!process.env.GROQ_API_KEY;
  res.end(JSON.stringify({ ok: true, ai: gemini || groq, gemini, groq }));
};

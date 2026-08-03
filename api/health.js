// GET /api/health
module.exports = (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
};

function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', err.message);

  if (err.response) {
    return res.status(err.response.status || 500).json({
      error: 'Erro na API externa',
      details: err.response.data?.message || err.message,
    });
  }

  res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
}

module.exports = errorHandler;

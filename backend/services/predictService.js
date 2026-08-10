const PREDICT_API_URL =
  process.env.PREDICT_API_URL ||
  "https://monitor-cogumelo.onrender.com/predict";

const PREDICT_TIMEOUT_MS = Number(process.env.PREDICT_TIMEOUT_MS) || 60000;

async function predictFromUrl(imageUrl) {
  if (!imageUrl) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PREDICT_TIMEOUT_MS);

  try {
    const response = await fetch(PREDICT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: imageUrl }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Erro na API de predição (${response.status}):`,
        errorText,
      );
      return null;
    }

    const result = await response.json();

    return {
      classe: result.classe,
      confianca: result.confianca,
      anomalia: result.anomalia,
      probabilidade_saudavel: result.probabilidade_saudavel,
      threshold_usado: result.threshold_usado,
      processado_em: new Date(),
    };
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Timeout na API de predição");
    } else {
      console.error("Erro ao chamar API de predição:", error.message);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { predictFromUrl };

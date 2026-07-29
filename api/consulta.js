// api/consulta.js
// Función serverless (Vercel). El padrón completo (registros.json) vive solo
// aquí, en el servidor. El navegador nunca recibe la lista completa: solo el
// resultado de la persona que consulta, si hay coincidencia.
//
// La búsqueda es EXCLUSIVAMENTE por número de registro o cédula de identidad.

const REGISTROS = require('./registros.json');

function normalizar(s) {
  return s
    .toString()
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]/g, '');
}

// Índices en memoria (se calculan una sola vez por instancia de la función)
const porRegistro = {};
const porDocto = {};
for (const r of REGISTROS) {
  porRegistro[normalizar(r.registro)] = r;
  porDocto[normalizar(r.docto)] = r;
}

function buscar(valorCrudo) {
  const valor = normalizar(valorCrudo);
  if (!valor) return null;

  if (porRegistro[valor]) return porRegistro[valor];
  if (porDocto[valor]) return porDocto[valor];

  // Coincidencia de cédula sin el código de ciudad (ej. "13303296" sin "-SCZ")
  const candidato = REGISTROS.find((r) => normalizar(r.docto).startsWith(valor));
  if (candidato) return candidato;

  return null;
}

// Límite simple de solicitudes por IP para dificultar el barrido del padrón
// completo (no sustituye una protección robusta, pero frena bots simples).
const intentosPorIp = new Map();
const LIMITE_POR_MINUTO = 20;

function excedeLimite(ip) {
  const ahora = Date.now();
  const ventana = 60 * 1000;
  const registro = intentosPorIp.get(ip) || [];
  const recientes = registro.filter((t) => ahora - t < ventana);
  recientes.push(ahora);
  intentosPorIp.set(ip, recientes);
  return recientes.length > LIMITE_POR_MINUTO;
}

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'desconocida';

  if (excedeLimite(ip)) {
    res.statusCode = 429;
    res.end(JSON.stringify({ error: 'Demasiadas consultas. Intenta de nuevo en un minuto.' }));
    return;
  }

  const valor = (req.query && req.query.valor) || '';

  if (!valor || valor.toString().trim().length < 2) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Escribe tu número de registro o cédula de identidad.' }));
    return;
  }

  const encontrado = buscar(valor);

  if (!encontrado) {
    res.statusCode = 200;
    res.end(JSON.stringify({ encontrado: false }));
    return;
  }

  // Solo se devuelven los campos necesarios para mostrar el resultado —
  // nunca el documento de identidad completo ni el resto del padrón.
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      encontrado: true,
      registro: encontrado.registro,
      nombre: encontrado.nombre,
      vota: encontrado.vota,
      recinto: encontrado.recinto,
      aula: encontrado.aula,
      mesa: encontrado.mesa,
      delegado: encontrado.delegado,
    })
  );
};

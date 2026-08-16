const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function testAPI() {
  console.log('🧪 Testando API da Fazenda Hidropônica...\n');
  
  try {
    console.log('1. Testando Health Check...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log(`   ✅ Status: ${healthResponse.data.message}\n`);

    console.log('2. Testando conexão com banco de dados...');
    const dbResponse = await axios.get(`${API_BASE}/test-db`);
    console.log(`   ✅ Banco: ${dbResponse.data.database} (${dbResponse.data.dialect})\n`);
    
    console.log('3. Testando criação de dispositivo...');
    const dispositivoData = {
      mac_address: '00:11:22:33:44:55',
      nome: 'ESP32-Teste',
      tipo: 'ESP32_SENSORES',
      localizacao: 'Setor de Testes'
    };
    
    const dispositivoResponse = await axios.post(`${API_BASE}/dispositivos`, dispositivoData);
    console.log(`   ✅ Dispositivo criado: ${dispositivoResponse.data.data.nome} (ID: ${dispositivoResponse.data.data.id})\n`);
    
    const dispositivoId = dispositivoResponse.data.data.id;
    
    console.log('4. Testando envio de leitura dos sensores...');
    const leituraData = {
      mac: '00:11:22:33:44:55',
      temp: 24.5,
      umid: 65.2,
      lux: 1250,
      ph: 6.1,
      cond: 1450.5,
      nivel: 1,
      bat: 85.5,
      rssi: -65
    };
    
    const leituraResponse = await axios.post(`${API_BASE}/leituras/sensores`, leituraData);
    console.log(`   ✅ Leitura recebida: ID ${leituraResponse.data.leitura_id}\n`);
    
    console.log('5. Testando listagem de dispositivos...');
    const dispositivosResponse = await axios.get(`${API_BASE}/dispositivos`);
    console.log(`   ✅ Total de dispositivos: ${dispositivosResponse.data.total}\n`);
    
    console.log('6. Testando dashboard...');
    const dashboardResponse = await axios.get(`${API_BASE}/dashboard/principal`);
    console.log(`   ✅ Dashboard carregado: ${dashboardResponse.data.data.metricas.dispositivos_online} dispositivo(s) online\n`);
    
    console.log('7. Testando dados para gráfico...');
    const graficoResponse = await axios.get(`${API_BASE}/leituras/${dispositivoId}/grafico?sensor=temperatura&periodo=24h`);
    console.log(`   ✅ Dados para gráfico: ${graficoResponse.data.total_pontos} ponto(s)\n`);
    
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('\n📊 RESUMO:');
    console.log(`• API: ${API_BASE}`);
    console.log(`• Dispositivo de teste: ESP32-Teste (ID: ${dispositivoId})`);
    console.log(`• Leitura de teste registrada`);
    console.log(`• Dashboard funcionando`);
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
    
    if (error.response) {
      console.error('   Detalhes:', error.response.data);
    }
    
    process.exit(1);
  }
}

async function checkServer() {
  try {
    await axios.get(`${API_BASE}/health`, { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

async function runTests() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('❌ Servidor não está rodando na porta 3000');
    console.log('👉 Execute primeiro: npm run dev');
    process.exit(1);
  }
  
  await testAPI();
}

runTests();
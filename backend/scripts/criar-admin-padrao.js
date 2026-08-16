const mongoose = require('mongoose');
const Admin = require('../models-mongodb/Admin');
require('dotenv').config();

async function criarAdminPadrao() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/selene');
    
    console.log('✅ Conectado ao MongoDB');

    const adminExistente = await Admin.findOne({ usuario: 'admin' });
    
    if (adminExistente) {
      console.log('⚠️  Administrador padrão já existe:');
      console.log(`   Usuário: ${adminExistente.usuario}`);
      console.log(`   Email: ${adminExistente.email}`);
      console.log(`   Nível: ${adminExistente.nivel_acesso}`);
      await mongoose.disconnect();
      return;
    }
    
    const admin = await Admin.create({
      usuario: 'admin',
      senha: 'admin123', 
      nome_completo: 'Administrador Padrão',
      email: 'admin@selene.com',
      nivel_acesso: 'superadmin'
    });
    
    console.log('✅ Administrador padrão criado com sucesso:');
    console.log(`   Usuário: ${admin.usuario}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nível: ${admin.nivel_acesso}`);
    console.log('\n🔐 Credenciais de acesso:');
    console.log('   Usuário: admin');
    console.log('   Senha: admin123');
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Erro ao criar administrador padrão:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  criarAdminPadrao();
}

module.exports = criarAdminPadrao;
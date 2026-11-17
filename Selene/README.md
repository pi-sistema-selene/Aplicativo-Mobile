# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Notificações push no Android

O push no Android requer credenciais FCM e um novo build nativo; instalar o
plugin ou atualizar o JavaScript sozinho não inicializa o Firebase.

1. No Firebase Console, crie/abra um app Android com o ID
   `com.dinozin.selene` e baixe o `google-services.json`.
2. No EAS, envie esse arquivo como uma variável de ambiente do tipo **File**
   chamada `GOOGLE_SERVICES_JSON` para o perfil de build usado. O `app.config.js`
   passa o caminho do arquivo ao Gradle sem incluir a credencial no Git.
3. Configure também as credenciais FCM do projeto EAS para o Expo Push Service.
4. Gere e instale um novo APK/build. O APK já instalado não passa a ter Firebase
   quando o arquivo é adicionado depois.

Para build local, coloque o arquivo em `google-services.json` (ignorado pelo
Git) e defina `GOOGLE_SERVICES_JSON=./google-services.json` antes de rodar o
prebuild/build Android.

## Atualização de dados em tempo real

As telas de dados usam Socket.IO autenticado para receber o evento
`data:changed` e buscar novamente as informações pela API. As alterações só
aparecem em tempo real quando a versão atualizada do backend está publicada e
o celular tem conexão com a internet; telas em segundo plano recarregam ao
voltar ao foco.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

export default {
  routes: [
    {
      method: 'GET',
      path: '/esplighters',
      handler: 'esplighter.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/esplighters',
      handler: 'esplighter.create', // Appelle la méthode create du contrôleur
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/esplighters/lightinfo',
      handler: 'esplighter.updateLightInfo', // Appelle la méthode updateLightInfo du contrôleur
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/esplighters/details',
      handler: 'esplighter.updateEsplighterDetails', // Appelle la méthode updateEsplighterDetails du contrôleur
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

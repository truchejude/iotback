import { factories } from '@strapi/strapi';
import { Context } from 'koa';

export default factories.createCoreController('api::esplighter.esplighter', ({ strapi }) => ({
  async find(ctx: Context) {
    const { user } = ctx.state; // Récupère l'utilisateur connecté
    if (!user) {
      return ctx.unauthorized('You are not authenticated'); // Gérer l'absence d'utilisateur
    }

    // Récupérer les Esplighters associés à l'utilisateur
    const esplighters = await strapi.entityService.findMany('api::esplighter.esplighter', {
      filters: {
        user: { id: user.id }, // Assure-toi que 'user' est bien le champ de relation
      },
    });

    return esplighters;
  },

  async create(ctx: Context) {
    const { user } = ctx.state; // Récupère l'utilisateur connecté
    if (!user) {
      return ctx.unauthorized('You are not authenticated');
    }

    const { UID } = ctx.request.body; // Récupère les données du corps de la requête

    // Crée le nouvel esplighter
    const newEsplighter = await strapi.entityService.create('api::esplighter.esplighter', {
      data: {
        UID,
        user: user.id, // Associe l'esplighter à l'utilisateur connecté
      },
    });

    return newEsplighter; // Renvoie le nouvel esplighter créé
  },

  // Nouvelle méthode pour mettre à jour le champ 'lightinfo'
  async updateLightInfo(ctx: Context) {
    const { user } = ctx.state; // Récupère l'utilisateur connecté
    if (!user) {
      return ctx.unauthorized('You are not authenticated');
    }

    const { id, lightinfo } = ctx.request.body; // Récupère les données du corps de la requête
    if (!id || typeof lightinfo !== 'number') {
      return ctx.badRequest('Invalid data');
    }

    // Met à jour l'esplighter spécifié si l'utilisateur connecté y est lié
    const updatedEsplighter = await strapi.entityService.update('api::esplighter.esplighter', id, {
      data: {
        lightinfo,
      },
      filters: {
        user: { id: user.id }, // Assure que seul l'utilisateur lié peut faire la mise à jour
      },
    });

    if (!updatedEsplighter) {
      return ctx.notFound('Esplighter not found or not owned by user');
    }

    return updatedEsplighter; // Renvoie l'esplighter mis à jour
  },

  async updateEsplighterDetails(ctx: Context) {
    const { user } = ctx.state; // Récupère l'utilisateur connecté
    console.log('Utilisateur connecté :', user); // Log de l'utilisateur

    if (!user) {
        return ctx.unauthorized('You are not authenticated');
    }

    const { id, Nom, lightMax, LightMin } = ctx.request.body; // Récupère les données du corps de la requête
    console.log('Données reçues :', ctx.request.body); // Log des données reçues

    // Vérifie que les données sont valides
    if (!id || typeof lightMax !== 'number' || typeof LightMin !== 'number' || typeof Nom !== 'string') {
        console.log('Données invalides :', { id, Nom, lightMax, LightMin }); // Log des données invalides
        return ctx.badRequest('Invalid data');
    }

    // Cherche l'esplighter à mettre à jour
    const esplighterToUpdate = await strapi.entityService.findOne('api::esplighter.esplighter', id, {
        filters: {
            user: { id: user.id }, // Vérifie que l'utilisateur est lié à cet Esplighter
        },
        populate: '*', // Optionnel, pour remplir les relations si nécessaire
    });

    console.log('Esplighter trouvé :', esplighterToUpdate); // Log de l'esplighter trouvé

    // Si aucun esplighter n'est trouvé, renvoie une erreur
    if (!esplighterToUpdate) {
        return ctx.notFound('Esplighter not found or not owned by user');
    }

    // Met à jour l'esplighter
    const updatedEsplighter = await strapi.entityService.update('api::esplighter.esplighter', id, {
        data: {
            Nom,
            lightMax,
            LightMin,
        },
    });

    console.log('Esplighter mis à jour :', updatedEsplighter); // Log de l'esplighter mis à jour
    return updatedEsplighter; // Renvoie l'esplighter mis à jour
}
}));

import mqtt from 'mqtt';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  bootstrap({ strapi }: { strapi: any }) {
    const client = mqtt.connect('mqtt://localhost:1883'); // Remplace par l'adresse de ton broker Mosquitto
    const nomDuTopic = "esplighter";

    // Se connecter au broker MQTT
    client.on('connect', () => {
      console.log('Connecté au broker MQTT');
      client.subscribe(nomDuTopic, (err) => {
        if (!err) {
          console.log(`Abonné au topic ${nomDuTopic}`);
        } else {
          console.error("Erreur d'abonnement:", err);
        }
      });
    });

    // Fonction pour mettre à jour l'enregistrement dans Strapi
    async function updateEsplighter(uid: string, lightinfo: number, email: string) {
      try {
        // Trouver l'utilisateur avec l'email spécifié
        const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
          filters: { email },
        });
        
        if (users.length === 0) {
          throw new Error(`Aucun utilisateur trouvé avec l'email ${email}`);
        }
        
        const userId = users[0].id;
        
        // Trouver l'Esplighter avec l'UID spécifié
        const esplighters = await strapi.entityService.findMany('api::esplighter.esplighter', {
          filters: { UID: uid },
        });
        
        if (esplighters.length > 0) {
          // Trier les Esplighters par ID croissant
          const sortedEsplighters = esplighters.sort((a, b) => a.id - b.id);
        
          // Identifier le dernier Esplighter (le plus récent, avec l'ID le plus grand)
          const esplighterToKeep = sortedEsplighters.pop(); // Retire et garde le dernier élément
          
          console.log(`Esplighter à conserver : ID ${esplighterToKeep.id}, UID ${uid}`);
        
          // Supprimer tous les autres Esplighters (ceux avec un ID plus petit)
          for (const esplighter of sortedEsplighters) {
            await strapi.entityService.delete('api::esplighter.esplighter', esplighter.id);
            console.log(`Esplighter avec ID ${esplighter.id} supprimé.`);
          }
        
          // Mettre à jour l'Esplighter conservé
          const esplighterId = esplighterToKeep.id;
          const { LightMin, lightMax } = esplighterToKeep;
        
          await strapi.entityService.update('api::esplighter.esplighter', esplighterId, {
            data: { lightinfo },
          });
        
          console.log(`Esplighter avec ID ${esplighterId} mis à jour avec lightinfo: ${lightinfo}`);
        
          // Déterminer l'état des LED
          let led1State = "off";
          let led2State = "off";
        
          if (LightMin === undefined || lightMax === undefined) {
            // Si les seuils ne sont pas définis, allumer les deux LED
            led1State = "on";
            led2State = "on";
          } else if (lightinfo < LightMin) {
            // Lightinfo trop bas -> allume LED 1
            led1State = "on";
          } else if (lightinfo > lightMax) {
            // Lightinfo trop élevé -> allume LED 2
            led2State = "on";
          }
        
          // Envoyer l'état des LED via Mosquitto
          const ledStateMessage = JSON.stringify({ led1: led1State, led2: led2State });
          const topic = uid; // Utilise l'UID comme topic
          client.publish(topic, ledStateMessage);
          console.log(`État des LED publié pour UID ${uid}: ${ledStateMessage} | ${LightMin} - ${lightMax}`);
        } else {
          // Créer un nouvel Esplighter et l'associer avec l'utilisateur
          await strapi.entityService.create('api::esplighter.esplighter', {
            data: {
              UID: uid,
              lightinfo,
              user: userId,
            },
          });
          console.log(`Nouvel Esplighter avec UID ${uid} créé et associé à l'utilisateur ${email}`);
        }               
      } catch (error) {
        console.error("Erreur lors de la mise à jour de l'Esplighter:", error);
      }
    }
    

    // Traiter les messages reçus
    client.on('message', (topic, message) => {
      try {
        const unformattedData = message.toString();
        const data = unformattedData.replace(/'/g, '"');
        console.log(`Message reçu sur le topic ${topic}: ${data}`);
        const parsedMessage = JSON.parse(data);
        console.log("deux");
        const uid = Object.keys(parsedMessage)[0];
        const lightinfo = parsedMessage[uid].lightinfo;
        const email = parsedMessage[uid].email;
        console.log(uid, lightinfo, email, parsedMessage);
        // Mettre à jour l'Esplighter dans Strapi
        updateEsplighter(uid, lightinfo, email);
      } catch (error) {
        console.error("Erreur lors du traitement du message MQTT:", error);
      }
    });
  },
};

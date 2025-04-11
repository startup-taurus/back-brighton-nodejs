// utils/cron-job.js (o donde configures las tareas programadas)
const cron = require('node-cron');
const { Op } = require('sequelize');
const { StudentTransferData } = require('../models'); // Importa el modelo
const moment = require('moment'); // Para manejar fechas fácilmente

// Tarea programada que se ejecuta cada día a medianoche
cron.schedule('0 0 * * *', async () => {
  const fourDaysAgo = moment().subtract(4, 'days').toDate();

  try {
    // Buscar registros con estado 'approved' y creados hace más de 4 días
    const transfersToUpdate = await StudentTransferData.findAll({
      where: {
        status_level_change: 'approved',
        created_at: { [Op.lt]: fourDaysAgo },
      },
    });

    // Actualizar el estado a 'n/a'
    const updatePromises = transfersToUpdate.map((transfer) =>
      transfer.update({ status_level_change: 'n/a' })
    );

    await Promise.all(updatePromises);

    console.log(`Updated ${transfersToUpdate.length} records to 'n/a'`);
  } catch (error) {
    console.error('Error while updating transfers to n/a:', error);
  }
});

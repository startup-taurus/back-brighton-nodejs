const cron = require('node-cron');
const { Op } = require('sequelize');
const { StudentTransferData } = require('../models'); 
const moment = require('moment'); 

cron.schedule('0 0 * * *', async () => {
  const fourDaysAgo = moment().subtract(4, 'days').toDate();

  try {
    const transfersToUpdate = await StudentTransferData.findAll({
      where: {
        status_level_change: 'approved',
        created_at: { [Op.lt]: fourDaysAgo },
      },
    });

    const updatePromises = transfersToUpdate.map((transfer) =>
      transfer.update({ status_level_change: 'n/a' })
    );

    await Promise.all(updatePromises);

  } catch (error) {
    console.error('Error while updating transfers to n/a:', error);
  }
});

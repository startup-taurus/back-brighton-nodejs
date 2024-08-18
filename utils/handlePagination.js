/**
 * Enviar la page y el pageSize de donde se desea consultar.
 * @param {*} page 
 * @param {*} pageSize 
 * @returns 
 */
function getPaginationOptions(page, pageSize) {
    const currentPage = parseInt(page) || 1;
    const pageSizeValue = parseInt(pageSize) || 10;
    const skipCount = (currentPage - 1) * pageSizeValue;
  
    return {
      currentPage,
      pageSizeValue,
      skipCount,
    };
  }
  
  module.exports = { getPaginationOptions };
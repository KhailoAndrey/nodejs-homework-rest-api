const express = require('express')

const {
    listContacts,
    getContactById,
    removeContact,
    addContact,
    updateContact } = require('../../controllers/contacts')
    
const { checkContactById, checkCreateContactData } = require('../../middlewares/contactMiddlewares');

const router = express.Router();

router
  .route('/')
  .post(checkCreateContactData, addContact)
  .get(listContacts);

router.use('/:id', checkContactById);
router
  .route('/:id')
  .get(getContactById)
  .patch(updateContact)
  .delete(removeContact);

module.exports = router;
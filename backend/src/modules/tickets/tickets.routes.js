// src/modules/tickets/tickets.routes.js
const express = require('express');
const ticketsController = require('./tickets.controller');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.post('/', ticketsController.createTicket);
router.get('/', ticketsController.getTickets);
router.patch('/:id/status', ticketsController.updateTicketStatus);
router.post('/:id/reply', ticketsController.replyToTicket);

module.exports = router;

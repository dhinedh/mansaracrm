// src/modules/tickets/tickets.controller.js
const prisma = require('../../config/database');

exports.createTicket = async (req, res, next) => {
  try {
    const { subject, category, priority, description } = req.body;

    const ticketNo = `TKT-${Date.now()}`;

    const ticket = await prisma.complaintTicket.create({
      data: {
        ticketNo,
        userId: req.user.id,
        subject,
        category,
        priority,
        status: 'OPEN',
        description,
        replies: []
      }
    });

    // Notify Admins
    if (req.user.role === 'DEALER') {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'SYSTEM',
            title: 'New Service Ticket',
            message: `Dealer ${req.user.name} submitted a new complaint ticket ${ticketNo}: "${subject}".`,
            metadata: { ticketId: ticket.id }
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Complaint ticket created successfully',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

exports.getTickets = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'DEALER') {
      where.userId = req.user.id;
    }

    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.category) {
      where.category = req.query.category;
    }

    const tickets = await prisma.complaintTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Populate userName if tickets belong to dealers
    const enrichedTickets = [];
    for (const t of tickets) {
      const creatorUser = await prisma.user.findUnique({
        where: { id: t.userId },
        include: { dealer: true }
      });
      enrichedTickets.push({
        ...t,
        creatorName: creatorUser ? (creatorUser.dealer?.companyName || creatorUser.name) : 'Unknown Partner'
      });
    }

    res.json({ success: true, data: enrichedTickets });
  } catch (error) {
    next(error);
  }
};

exports.updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // OPEN, IN_PROGRESS, RESOLVED

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only admins can change ticket status' });
    }

    const ticket = await prisma.complaintTicket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const updated = await prisma.complaintTicket.update({
      where: { id },
      data: { status }
    });

    // Notify Dealer
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        type: 'ACCOUNT_UPDATE',
        title: `Service Ticket ${status}`,
        message: `Your complaint ticket ${ticket.ticketNo} has been marked as ${status.replace('_', ' ')}.`,
        metadata: { ticketId: ticket.id, status }
      }
    });

    res.json({ success: true, message: 'Ticket status updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

exports.replyToTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const ticket = await prisma.complaintTicket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { dealer: true }
    });
    const userName = userProfile.role === 'ADMIN' 
      ? 'Mansara Support' 
      : (userProfile.dealer?.companyName || userProfile.name);

    const reply = {
      userId: req.user.id,
      userName,
      message,
      createdAt: new Date()
    };

    const updated = await prisma.complaintTicket.update({
      where: { id },
      data: {
        replies: [...(ticket.replies || []), reply]
      }
    });

    // Notify other party
    if (req.user.role === 'DEALER') {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'SYSTEM',
            title: 'Reply on Ticket',
            message: `Dealer ${userName} replied on ticket ${ticket.ticketNo}.`,
            metadata: { ticketId: ticket.id }
          }
        });
      }
    } else {
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          type: 'SYSTEM',
          title: 'Reply from Support',
          message: `Mansara Support replied on your complaint ticket ${ticket.ticketNo}.`,
          metadata: { ticketId: ticket.id }
        }
      });
    }

    res.json({ success: true, message: 'Reply posted successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

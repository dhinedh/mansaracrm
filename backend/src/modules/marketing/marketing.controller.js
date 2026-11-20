// backend/src/modules/marketing/marketing.controller.js
const prisma = require('../../config/database');
const mongoose = require('mongoose');
const { logAudit } = require('../../utils/auditLogger');

/**
 * GET /api/marketing/events
 * List events with date/status/assignee filtering
 */
exports.getEvents = async (req, res, next) => {
  try {
    const { 
      status, 
      eventType, 
      month, 
      year, 
      assignedTo, 
      search,
      view = 'ALL' // 'ALL' or 'MY_EVENTS'
    } = req.query;

    const MarketingEventModel = mongoose.model('MarketingEvent');
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (eventType && eventType !== 'ALL') {
      query.eventType = eventType;
    }

    // Role-based filtering: Sales/Marketing reps only see assigned events when viewing MY_EVENTS
    if (view === 'MY_EVENTS' || (req.user.role === 'SALES' && !['ADMIN', 'B2B_MANAGER'].includes(req.user.role))) {
      query.assignedUserIds = req.user.id;
    } else if (assignedTo) {
      query.assignedUserIds = assignedTo;
    }

    // Month & Year filtering
    if (month !== undefined && year !== undefined && month !== '' && year !== '') {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      const startOfMonth = new Date(y, m, 1);
      const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59, 999);
      query.startDate = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (year) {
      const y = parseInt(year, 10);
      const startOfYear = new Date(y, 0, 1);
      const endOfYear = new Date(y, 11, 31, 23, 59, 59, 999);
      query.startDate = { $gte: startOfYear, $lte: endOfYear };
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { eventType: new RegExp(search, 'i') }
      ];
    }

    const events = await MarketingEventModel.find(query)
      .populate('assignedUserIds', 'name email phone role')
      .populate('createdBy', 'name email role')
      .populate('completedBy', 'name email role')
      .sort({ startDate: 1 })
      .lean();

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/marketing/events
 * Create marketing event and notify assigned personnel
 */
exports.createEvent = async (req, res, next) => {
  try {
    const {
      title,
      eventType = 'Promotion',
      startDate,
      endDate,
      location,
      assignedUserIds = [],
      assignedTeam,
      description,
      status = 'UPCOMING'
    } = req.body;

    if (!title || !startDate || !location) {
      return res.status(400).json({
        success: false,
        message: 'Event title, start date, and location are required'
      });
    }

    const MarketingEventModel = mongoose.model('MarketingEvent');

    const validAssignees = Array.isArray(assignedUserIds) 
      ? assignedUserIds.filter(id => mongoose.Types.ObjectId.isValid(id))
      : (assignedUserIds ? [assignedUserIds] : []);

    const event = await MarketingEventModel.create({
      title: title.trim(),
      eventType,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : new Date(startDate),
      location: location.trim(),
      assignedUserIds: validAssignees,
      assignedTeam: assignedTeam ? assignedTeam.trim() : undefined,
      description: description ? description.trim() : '',
      status: status.toUpperCase(),
      createdBy: req.user.id,
      activityHistory: [{
        action: 'CREATED',
        performedBy: req.user.id,
        notes: `Event created by ${req.user.name || 'Admin'}`,
        timestamp: new Date()
      }]
    });

    // Notify assigned users
    if (validAssignees.length > 0) {
      for (const uid of validAssignees) {
        try {
          await prisma.notification.create({
            data: {
              userId: uid,
              type: 'MARKETING_EVENT_ASSIGNED',
              title: `New Marketing Event: ${title}`,
              message: `You have been assigned to "${title}" (${eventType}) scheduled on ${new Date(startDate).toLocaleDateString()} at ${location}.`,
              metadata: { eventId: event._id.toString() }
            }
          });
        } catch (notifErr) {
          console.error('Error creating assignment notification:', notifErr.message);
        }
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'MarketingEvent',
      entityId: event._id.toString(),
      recordTitle: title,
      details: `Created ${eventType} event scheduled for ${new Date(startDate).toLocaleDateString()}`,
      newValues: event.toObject(),
      req
    });

    const populated = await MarketingEventModel.findById(event._id)
      .populate('assignedUserIds', 'name email phone role')
      .populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Marketing event created successfully and notifications dispatched',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/marketing/events/:id
 */
exports.getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const MarketingEventModel = mongoose.model('MarketingEvent');

    const event = await MarketingEventModel.findById(id)
      .populate('assignedUserIds', 'name email phone role')
      .populate('createdBy', 'name email role')
      .populate('completedBy', 'name email role')
      .populate('activityHistory.performedBy', 'name email role');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/marketing/events/:id
 * Update event details
 */
exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const MarketingEventModel = mongoose.model('MarketingEvent');

    const event = await MarketingEventModel.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const oldValues = event.toObject();
    const {
      title,
      eventType,
      startDate,
      endDate,
      location,
      assignedUserIds,
      assignedTeam,
      description,
      status
    } = req.body;

    if (title) event.title = title.trim();
    if (eventType) event.eventType = eventType;
    if (startDate) event.startDate = new Date(startDate);
    if (endDate) event.endDate = new Date(endDate);
    if (location) event.location = location.trim();
    if (assignedTeam !== undefined) event.assignedTeam = assignedTeam;
    if (description !== undefined) event.description = description;
    if (status) event.status = status.toUpperCase();

    if (assignedUserIds) {
      const validAssignees = Array.isArray(assignedUserIds) 
        ? assignedUserIds.filter(uid => mongoose.Types.ObjectId.isValid(uid))
        : [assignedUserIds];
      event.assignedUserIds = validAssignees;
    }

    event.activityHistory.push({
      action: 'UPDATED',
      performedBy: req.user.id,
      notes: `Details updated by ${req.user.name || 'User'}`,
      timestamp: new Date()
    });

    await event.save();

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'MarketingEvent',
      entityId: id,
      recordTitle: event.title,
      details: 'Updated marketing event details',
      oldValues,
      newValues: event.toObject(),
      req
    });

    const updated = await MarketingEventModel.findById(id)
      .populate('assignedUserIds', 'name email phone role')
      .populate('createdBy', 'name email role')
      .populate('completedBy', 'name email role');

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/marketing/events/:id/complete
 * Mark event completed, add completion notes & store event photos
 */
exports.completeEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { completionNotes = '', photoUrls = [] } = req.body;
    const MarketingEventModel = mongoose.model('MarketingEvent');

    const event = await MarketingEventModel.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const oldValues = event.toObject();

    // Check uploaded files if sent via multipart form data
    const uploadedPhotos = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(f => {
        uploadedPhotos.push(`/uploads/${f.filename}`);
      });
    }

    // Combine photos from direct URLs or file uploads
    const allNewPhotos = [...uploadedPhotos];
    if (Array.isArray(photoUrls)) {
      allNewPhotos.push(...photoUrls.filter(Boolean));
    } else if (typeof photoUrls === 'string' && photoUrls.trim()) {
      allNewPhotos.push(photoUrls.trim());
    }

    event.status = 'COMPLETED';
    event.completionNotes = completionNotes.trim();
    event.completedAt = new Date();
    event.completedBy = req.user.id;
    if (allNewPhotos.length > 0) {
      event.photos = [...(event.photos || []), ...allNewPhotos];
    }

    event.activityHistory.push({
      action: 'COMPLETED',
      performedBy: req.user.id,
      notes: `Event completed by ${req.user.name}. Added ${allNewPhotos.length} photo(s).`,
      timestamp: new Date()
    });

    await event.save();

    // Notify admins
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });
      for (const adm of admins) {
        await prisma.notification.create({
          data: {
            userId: adm.id,
            type: 'MARKETING_EVENT_COMPLETED',
            title: `Event Completed: ${event.title}`,
            message: `${req.user.name || 'Marketing person'} has completed "${event.title}" and uploaded ${allNewPhotos.length} photo(s).`,
            metadata: { eventId: event._id.toString() }
          }
        });
      }
    } catch (e) {
      console.error('Failed to notify admins of event completion:', e.message);
    }

    await logAudit({
      userId: req.user.id,
      action: 'STATUS_CHANGE',
      entity: 'MarketingEvent',
      entityId: id,
      recordTitle: event.title,
      details: `Completed event with ${allNewPhotos.length} photo(s)`,
      oldValues,
      newValues: event.toObject(),
      req
    });

    const populated = await MarketingEventModel.findById(id)
      .populate('assignedUserIds', 'name email phone role')
      .populate('createdBy', 'name email role')
      .populate('completedBy', 'name email role');

    res.json({
      success: true,
      message: 'Event marked as completed with uploaded photos saved',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/marketing/events/:id/photos
 * Upload additional photos to an existing event
 */
exports.uploadEventPhotos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const MarketingEventModel = mongoose.model('MarketingEvent');

    const event = await MarketingEventModel.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const uploadedPhotos = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(f => {
        uploadedPhotos.push(`/uploads/${f.filename}`);
      });
    }

    if (req.body.photoUrls) {
      const urls = Array.isArray(req.body.photoUrls) ? req.body.photoUrls : [req.body.photoUrls];
      uploadedPhotos.push(...urls.filter(Boolean));
    }

    if (uploadedPhotos.length === 0) {
      return res.status(400).json({ success: false, message: 'No photos provided for upload' });
    }

    event.photos = [...(event.photos || []), ...uploadedPhotos];
    event.activityHistory.push({
      action: 'PHOTOS_UPLOADED',
      performedBy: req.user.id,
      notes: `${uploadedPhotos.length} photo(s) uploaded by ${req.user.name || 'User'}`,
      timestamp: new Date()
    });

    await event.save();

    res.json({
      success: true,
      message: `${uploadedPhotos.length} photo(s) added successfully`,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/marketing/staff
 * Get available marketing/sales personnel to assign
 */
exports.getMarketingStaff = async (req, res, next) => {
  try {
    const UserModel = mongoose.model('User');
    const staff = await UserModel.find({
      isActive: true,
      role: { $in: ['ADMIN', 'SALES', 'B2B_MANAGER', 'STAFF', 'MARKETING'] }
    })
      .select('name email phone role')
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/marketing/events/:id
 */
exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const MarketingEventModel = mongoose.model('MarketingEvent');

    const event = await MarketingEventModel.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const oldValues = event.toObject();
    await MarketingEventModel.findByIdAndDelete(id);

    await logAudit({
      userId: req.user.id,
      action: 'DELETE',
      entity: 'MarketingEvent',
      entityId: id,
      recordTitle: event.title,
      details: 'Deleted marketing event',
      oldValues,
      req
    });

    res.json({
      success: true,
      message: 'Marketing event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

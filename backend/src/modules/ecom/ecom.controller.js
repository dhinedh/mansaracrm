// src/modules/ecom/ecom.controller.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');

// Get Mongoose Models
const Order = mongoose.model('Order');
const Product = mongoose.model('Product');
const Combo = mongoose.model('Combo');
const Banner = mongoose.model('Banner');
const BlogPost = mongoose.model('BlogPost');
const Career = mongoose.model('Career');
const PressRelease = mongoose.model('PressRelease');
const Review = mongoose.model('Review');
const Setting = mongoose.model('Setting');
const User = mongoose.model('User');

// ======================================================
// WEBSITE ORDERS
// ======================================================

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone whatsapp')
      .populate('items.product', 'name price imageUrl sku')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone whatsapp')
      .populate('items.product', 'name price imageUrl sku');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    order.orderStatus = status;
    if (status === 'Delivered') {
      order.paymentStatus = 'Paid';
    }
    await order.save();
    res.json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    next(error);
  }
};

exports.confirmOrder = async (req, res, next) => {
  try {
    const { estimatedDeliveryDate } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    order.orderStatus = 'Processing';
    if (estimatedDeliveryDate) {
      order.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
    }
    await order.save();
    res.json({ success: true, message: 'Order confirmed successfully', order });
  } catch (error) {
    next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// COMBOS
// ======================================================

exports.getCombos = async (req, res, next) => {
  try {
    const combos = await Combo.find().populate('products', 'name price sku imageUrl');
    res.json({ success: true, combos });
  } catch (error) {
    next(error);
  }
};

exports.createCombo = async (req, res, next) => {
  try {
    const { name, description, price, comboPrice, products, active } = req.body;
    
    // Generate SKU and slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const randomNum = Math.floor(Math.random() * 1000);
    const sku = `CMB-${Date.now()}-${randomNum}`;

    // Create combo which is a Product discriminator
    const combo = await Combo.create({
      name,
      slug,
      sku,
      description: description || name,
      price: parseFloat(price || comboPrice),
      comboPrice: parseFloat(comboPrice),
      products,
      isActive: active !== undefined ? active : true,
      category: new mongoose.Types.ObjectId(), // Placeholders for required Product fields
      image: req.body.image || '/logo.png'
    });

    res.status(201).json({ success: true, message: 'Combo created successfully', combo });
  } catch (error) {
    next(error);
  }
};

exports.updateCombo = async (req, res, next) => {
  try {
    const { name, description, price, comboPrice, products, active, image } = req.body;
    const combo = await Combo.findById(req.params.id);
    if (!combo) {
      return res.status(404).json({ success: false, message: 'Combo not found' });
    }

    if (name) {
      combo.name = name;
      combo.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    if (description !== undefined) combo.description = description;
    if (price !== undefined) combo.price = parseFloat(price);
    if (comboPrice !== undefined) combo.comboPrice = parseFloat(comboPrice);
    if (products !== undefined) combo.products = products;
    if (active !== undefined) combo.isActive = active;
    if (image !== undefined) combo.image = image;

    await combo.save();
    res.json({ success: true, message: 'Combo updated successfully', combo });
  } catch (error) {
    next(error);
  }
};

exports.deleteCombo = async (req, res, next) => {
  try {
    const combo = await Combo.findByIdAndDelete(req.params.id);
    if (!combo) {
      return res.status(404).json({ success: false, message: 'Combo not found' });
    }
    res.json({ success: true, message: 'Combo deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// BANNERS
// ======================================================

exports.getBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ order: 1 });
    res.json({ success: true, banners });
  } catch (error) {
    next(error);
  }
};

exports.createBanner = async (req, res, next) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({ success: true, message: 'Banner created successfully', banner });
  } catch (error) {
    next(error);
  }
};

exports.updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    res.json({ success: true, message: 'Banner updated successfully', banner });
  } catch (error) {
    next(error);
  }
};

exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// REVIEWS
// ======================================================

exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('product', 'name sku imageUrl')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};

exports.approveReview = async (req, res, next) => {
  try {
    const { isApproved } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    review.isApproved = isApproved;
    await review.save();
    res.json({ success: true, message: `Review ${isApproved ? 'approved' : 'unapproved'} successfully`, review });
  } catch (error) {
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// BLOG
// ======================================================

exports.getBlogPosts = async (req, res, next) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

exports.createBlogPost = async (req, res, next) => {
  try {
    const { title, content, excerpt, featuredImage, category, isPublished } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const post = await BlogPost.create({
      title,
      content,
      excerpt,
      featuredImage,
      category,
      isPublished: isPublished === 'true' || isPublished === true,
      publishedAt: (isPublished === 'true' || isPublished === true) ? new Date() : null,
      slug
    });
    res.status(201).json({ success: true, message: 'Blog post created successfully', post });
  } catch (error) {
    next(error);
  }
};

exports.updateBlogPost = async (req, res, next) => {
  try {
    const { title, content, excerpt, featuredImage, category, isPublished } = req.body;
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    if (title) {
      post.title = title;
      post.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    if (content !== undefined) post.content = content;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (featuredImage !== undefined) post.featuredImage = featuredImage;
    if (category !== undefined) post.category = category;
    if (isPublished !== undefined) {
      post.isPublished = isPublished;
      if (isPublished && !post.publishedAt) {
        post.publishedAt = new Date();
      }
    }

    await post.save();
    res.json({ success: true, message: 'Blog post updated successfully', post });
  } catch (error) {
    next(error);
  }
};

exports.deleteBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }
    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// CAREERS
// ======================================================

exports.getCareers = async (req, res, next) => {
  try {
    const careers = await Career.find().sort({ createdAt: -1 });
    res.json({ success: true, careers });
  } catch (error) {
    next(error);
  }
};

exports.createCareer = async (req, res, next) => {
  try {
    const { title, description, requirements, responsibilities, location, department, employmentType, experience, salaryMin, salaryMax } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const career = await Career.create({
      title,
      description,
      requirements: Array.isArray(requirements) ? requirements : (requirements ? [requirements] : []),
      responsibilities: Array.isArray(responsibilities) ? responsibilities : (responsibilities ? [responsibilities] : []),
      location,
      department,
      employmentType,
      experience,
      salary: {
        min: salaryMin ? parseFloat(salaryMin) : undefined,
        max: salaryMax ? parseFloat(salaryMax) : undefined,
        currency: 'INR'
      },
      slug
    });
    res.status(201).json({ success: true, message: 'Career opening created successfully', career });
  } catch (error) {
    next(error);
  }
};

exports.updateCareer = async (req, res, next) => {
  try {
    const { title, description, requirements, responsibilities, location, department, employmentType, experience, salaryMin, salaryMax, isActive } = req.body;
    const career = await Career.findById(req.params.id);
    if (!career) {
      return res.status(404).json({ success: false, message: 'Career not found' });
    }

    if (title) {
      career.title = title;
      career.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    if (description !== undefined) career.description = description;
    if (requirements !== undefined) career.requirements = Array.isArray(requirements) ? requirements : [requirements];
    if (responsibilities !== undefined) career.responsibilities = Array.isArray(responsibilities) ? responsibilities : [responsibilities];
    if (location !== undefined) career.location = location;
    if (department !== undefined) career.department = department;
    if (employmentType !== undefined) career.employmentType = employmentType;
    if (experience !== undefined) career.experience = experience;
    if (isActive !== undefined) career.isActive = isActive;
    if (salaryMin !== undefined || salaryMax !== undefined) {
      career.salary = {
        min: salaryMin !== undefined ? parseFloat(salaryMin) : career.salary.min,
        max: salaryMax !== undefined ? parseFloat(salaryMax) : career.salary.max,
        currency: 'INR'
      };
    }

    await career.save();
    res.json({ success: true, message: 'Career opening updated successfully', career });
  } catch (error) {
    next(error);
  }
};

exports.deleteCareer = async (req, res, next) => {
  try {
    const career = await Career.findByIdAndDelete(req.params.id);
    if (!career) {
      return res.status(404).json({ success: false, message: 'Career opening not found' });
    }
    res.json({ success: true, message: 'Career opening deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// PRESS RELEASES
// ======================================================

exports.getPressReleases = async (req, res, next) => {
  try {
    const releases = await PressRelease.find().sort({ date: -1 });
    res.json({ success: true, releases });
  } catch (error) {
    next(error);
  }
};

exports.createPressRelease = async (req, res, next) => {
  try {
    const { title, summary, content, externalLink, image, isPublished } = req.body;
    const release = await PressRelease.create({
      title,
      summary,
      content,
      externalLink,
      image,
      isPublished: isPublished === 'true' || isPublished === true
    });
    res.status(201).json({ success: true, message: 'Press release created successfully', release });
  } catch (error) {
    next(error);
  }
};

exports.updatePressRelease = async (req, res, next) => {
  try {
    const release = await PressRelease.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!release) {
      return res.status(404).json({ success: false, message: 'Press release not found' });
    }
    res.json({ success: true, message: 'Press release updated successfully', release });
  } catch (error) {
    next(error);
  }
};

exports.deletePressRelease = async (req, res, next) => {
  try {
    const release = await PressRelease.findByIdAndDelete(req.params.id);
    if (!release) {
      return res.status(404).json({ success: false, message: 'Press release not found' });
    }
    res.json({ success: true, message: 'Press release deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// RETAIL CUSTOMERS
// ======================================================

exports.getCustomers = async (req, res, next) => {
  try {
    // Customers are stored in users collection, filter by role === 'user' or isAdmin === false
    const rawCustomers = await User.find({ role: { $ne: 'ADMIN' } })
      .select('name email phone whatsapp joinDate createdAt status totalSpent totalOrders lastLogin')
      .sort({ createdAt: -1 })
      .lean();
    
    const customers = rawCustomers.map(c => ({
      ...c,
      joinedDate: c.createdAt || c.joinDate
    }));

    res.json({ success: true, customers });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id).select('-password');
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Also fetch their e-commerce orders
    const orders = await Order.find({ user: customer._id }).sort({ createdAt: -1 });

    res.json({ success: true, customer, orders });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// WEBSITE SETTINGS
// ======================================================

exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne({ key: 'site_settings' });
    if (!settings) {
      // Create default settings if not exists
      settings = await Setting.create({
        key: 'site_settings',
        website_name: 'MANSARA Foods',
        contact_email: 'contact@mansarafoods.com',
        phone_number: '+91 9838887064',
        address: 'No 45, traditional hub, Chennai',
        freeShippingThreshold: 500,
        defaultShippingCharge: 50
      });
    }
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await Setting.findOneAndUpdate(
      { key: 'site_settings' },
      req.body,
      { new: true, upsert: true }
    );
    res.json({ success: true, message: 'Settings updated successfully', settings });
  } catch (error) {
    next(error);
  }
};
// ======================================================
// B2C → CRM DEALER CHANNEL INTEGRATION
// ======================================================

/**
 * Promote a B2C ecom customer to a CRM Dealer account (channelSource: 'B2C').
 * Creates a Prisma User + Dealer record linked to the ecom customer.
 * Also patches the ecom User record with crmDealerId for bidirectional linking.
 */
exports.promoteToDealer = async (req, res, next) => {
  try {
    const { id } = req.params; // ecom Mongoose User ID
    const {
      companyName,
      dealerType,
      dealerCategory,
      address,
      city,
      state,
      pincode,
      gstNumber,
      zones,
      defaultMargin,
      billingProfile
    } = req.body;

    // Fetch B2C customer from ecom DB
    const ecomUser = await User.findById(id).select('-password');
    if (!ecomUser) {
      return res.status(404).json({ success: false, message: 'B2C customer not found' });
    }

    // Check if already promoted
    if (ecomUser.crmDealerId) {
      return res.status(400).json({ success: false, message: 'This customer is already linked to a CRM dealer account.' });
    }

    // Check if a CRM user with this email already exists
    const existingCrmUser = await prisma.user.findUnique({ where: { email: ecomUser.email } });
    if (existingCrmUser) {
      return res.status(400).json({ success: false, message: 'A CRM account with this email already exists.' });
    }

    const defaultPassword = `B2C@${(ecomUser.phone || '123456').slice(-6)}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const resolvedAddress = address || ecomUser.address || 'Address not provided';
    const resolvedPhone = ecomUser.phone || ecomUser.whatsapp || '0000000000';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create CRM user
      const crmUser = await tx.user.create({
        data: {
          email: ecomUser.email,
          password: hashedPassword,
          name: ecomUser.name,
          role: 'DEALER',
          isActive: true
        }
      });

      // 2. Create Dealer
      const dealer = await tx.dealer.create({
        data: {
          userId: crmUser.id,
          companyName: companyName || ecomUser.name,
          gstNumber: gstNumber || null,
          address: resolvedAddress,
          city: city || ecomUser.city || '',
          state: state || ecomUser.state || '',
          pincode: pincode || ecomUser.pincode || '',
          zones: zones && zones.length > 0 ? zones : [],
          phone: resolvedPhone,
          dealerType: dealerType || 'RETAIL',
          dealerCategory: dealerCategory || 'STARTER',
          billingProfile: billingProfile || 'NORMAL',
          channelSource: 'B2C',
          approvalStatus: 'APPROVED'  // B2C promote = auto-approved
        }
      });

      // 3. Create default margin
      await tx.margin.create({
        data: {
          dealerId: dealer.id,
          marginPercent: defaultMargin ? parseFloat(defaultMargin) : 0,
          isDefault: true
        }
      });

      // 4. Audit log
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'PROMOTE_B2C_TO_DEALER',
          entity: 'Dealer',
          entityId: dealer.id,
          newValues: { ecomUserId: id, email: ecomUser.email, companyName: dealer.companyName }
        }
      });

      return { crmUser, dealer };
    });

    // 5. Mark ecom user as promoted (bidirectional link)
    await User.findByIdAndUpdate(id, {
      crmDealerId: result.dealer.id,
      channelSource: 'CRM_LINKED'
    });

    res.json({
      success: true,
      message: `B2C customer '${ecomUser.name}' promoted to CRM Dealer successfully.`,
      data: {
        dealerId: result.dealer.id,
        crmUserId: result.crmUser.id,
        email: ecomUser.email,
        defaultPassword
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all B2C ecom customers, with a flag indicating if they've been promoted to CRM Dealer.
 */
exports.getB2CCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: { $ne: 'ADMIN' } })
      .select('name email phone whatsapp address city state pincode joinedDate status totalSpent totalOrders lastLogin crmDealerId channelSource createdAt')
      .sort({ createdAt: -1 });

    // Enrich with order count
    const enriched = await Promise.all(customers.map(async (c) => {
      const orderCount = await Order.countDocuments({ user: c._id });
      const totalSpent = await Order.aggregate([
        { $match: { user: c._id, paymentStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);
      return {
        ...c.toObject(),
        totalOrders: orderCount,
        totalSpent: totalSpent[0]?.total || c.totalSpent || 0,
        isPromoted: !!c.crmDealerId
      };
    }));

    res.json({ success: true, customers: enriched });
  } catch (error) {
    next(error);
  }
};

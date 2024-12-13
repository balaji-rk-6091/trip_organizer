const User = require('../models/userModel');
const Admin = require('../models/adminModel');
const FamilyDetails = require('../models/familyDetailsModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

exports.register = async (req, res) => {
  const { username, password } = req.body;
  try {
    let admin = await Admin.findOne({ where: { username } });
    if (admin) {
      return res.status(400).json({ msg: 'Admin already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    admin = await Admin.create({
      username,
      password: hashedPassword,
    });
    res.send('Admin registered');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    let admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const payload = { admin: { id: admin.id, role: 'admin' } };
    jwt.sign(payload, 'secret', { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getUsers = async (req, res) => {
  const { payment_status } = req.query;
  const whereClause = {};

  if (payment_status) {
    whereClause.payment_status = payment_status;
  }

  try {
    const users = await User.findAll({ 
      where: whereClause,
      include: [{
        model: FamilyDetails,
        as: 'family_details'
      }] 
    });
    res.json(users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      dob: user.dob,
      office_amount: user.office_amount,
      additional_amount: user.additional_amount,
      amount_payable: user.amount_payable,
      payment_status: user.payment_status,
      is_family_included: user.is_family_included,
      adults_count: user.adults_count,
      kids_count: user.kids_count,
      infants_count: user.infants_count,
      family_details: user.family_details.map(family => ({
        id: family.id,
        user_id: family.user_id,
        first_name: family.first_name,
        middle_name: family.middle_name,
        last_name: family.last_name,
        dob: family.dob
      }))
    })));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateUserPaymentStatus = async (req, res) => {
  const { user_id, payment_status } = req.body;
  const validStatuses = ['paid', 'not_done'];

  if (!validStatuses.includes(payment_status)) {
    return res.status(400).json({ msg: 'Invalid payment status' });
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    user.payment_status = payment_status;
    await user.save();

    // Return the updated user details
    const { office_amount, additional_amount, amount_payable, payment_status: updated_payment_status } = user;
    res.json({ office_amount, additional_amount, amount_payable, payment_status: updated_payment_status });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const total_users = await User.count();
    const total_family_members = await FamilyDetails.count();

    const currentDate = new Date();
    const adultAge = new Date(currentDate.setFullYear(currentDate.getFullYear() - 12));
    const kidsAge = new Date(currentDate.setFullYear(currentDate.getFullYear() - 10));
    const infantsAge = new Date(currentDate.setFullYear(currentDate.getFullYear() - 2));

    const adult_count = await User.count({
      where: {
        dob: {
          [Op.lte]: adultAge
        }
      }
    }) + await FamilyDetails.count({
      where: {
        dob: {
          [Op.lte]: adultAge
        }
      }
    });

    const kids_count = await FamilyDetails.count({
      where: {
        dob: {
          [Op.between]: [kidsAge, adultAge]
        }
      }
    });

    const infants_count = await FamilyDetails.count({
      where: {
        dob: {
          [Op.gt]: infantsAge
        }
      }
    });

    const total_amount = await User.sum('amount_payable');
    const amount_collected = await User.sum('amount_payable', {
      where: {
        payment_status: 'paid'
      }
    });
    const yet_to_collect = await User.sum('amount_payable', {
      where: {
        payment_status: {
          [Op.ne]: 'paid'
        }
      }
    });

    const paid_count = await User.count({
      where: {
        payment_status: 'paid'
      }
    });

    const not_paid_count = await User.count({
      where: {
        payment_status: {
          [Op.ne]: 'paid'
        }
      }
    });

    res.json({
      total_users,
      total_family_members,
      adult_count,
      kids_count,
      infants_count,
      total_amount,
      amount_collected,
      yet_to_collect,
      paid_count,
      not_paid_count
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
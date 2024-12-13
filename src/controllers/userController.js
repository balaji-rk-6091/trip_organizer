const User = require('../models/userModel');
const FamilyDetails = require('../models/familyDetailsModel');
const { sequelize } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password, dob, office_amount, additional_amount, amount_payable, payment_status, is_family_included, adults_count, kids_count, infants_count } = req.body;
  try {
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ message: 'User already exists', error_code: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      dob,
      office_amount,
      additional_amount,
      amount_payable,
      payment_status,
      is_family_included,
      adults_count,
      kids_count,
      infants_count
    });
    res.status(201).json({
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
      infants_count: user.infants_count
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const { email, dob } = req.body;
  try {
    let user = await User.findOne({ where: { email, dob } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials', error_code: 400 });
    }
    const payload = { user: { id: user.id } };
    jwt.sign(payload, 'secret', { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.fetchUserDetails = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(400).json({ message: 'User not found', error_code: 400 });
    }

    const family_details = await FamilyDetails.findAll({ where: { user_id: req.user.id } });

    const { name, email, dob, office_amount, additional_amount, amount_payable, payment_status, is_family_included, adults_count, kids_count, infants_count } = user;
    res.json({
      name,
      email,
      dob,
      office_amount,
      additional_amount,
      amount_payable,
      payment_status,
      is_family_included,
      adults_count,
      kids_count,
      infants_count,
      family_details
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updatePaymentStatus = async (req, res) => {
  const { payment_status } = req.body;
  const validStatuses = ['not_done', 'pending'];

  if (!validStatuses.includes(payment_status)) {
    return res.status(400).json({ message: 'Invalid payment status', error_code: 400 });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(400).json({ message: 'User not found', error_code: 400 });
    }

    user.payment_status = payment_status;
    await user.save();

    // Return the same response as fetchUserDetails
    const family_details = await FamilyDetails.findAll({ where: { user_id: req.user.id } });
    const { name, email, dob, office_amount, additional_amount, amount_payable, payment_status: updatedPaymentStatus, is_family_included, adults_count, kids_count, infants_count } = user;
    res.status(200).json({
      name,
      email,
      dob,
      office_amount,
      additional_amount,
      amount_payable,
      payment_status: updatedPaymentStatus,
      is_family_included,
      adults_count,
      kids_count,
      infants_count,
      family_details
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error', error_code: 500 });
  }
};

exports.updateFamilyDetails = async (req, res) => {
  const { family_details } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      transaction
    });
    if (!user) {
      await transaction.rollback();
      return res.status(400).json({ message: 'User not found', error_code: 400 });
    }

    // Update family details within the transaction
    await FamilyDetails.destroy({ where: { user_id: req.user.id }, transaction });
    const familyDetailsArray = await FamilyDetails.bulkCreate(
      family_details.map(detail => ({ ...detail, user_id: req.user.id })),
      { transaction }
    );

    // Commit the transaction
    await transaction.commit();

    // Fetch updated user details
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      name: updatedUser.name,
      email: updatedUser.email,
      dob: updatedUser.dob,
      office_amount: updatedUser.office_amount,
      additional_amount: updatedUser.additional_amount,
      amount_payable: updatedUser.amount_payable,
      payment_status: updatedUser.payment_status,
      is_family_included: updatedUser.is_family_included,
      adults_count: updatedUser.adults_count,
      kids_count: updatedUser.kids_count,
      infants_count: updatedUser.infants_count,
      family_details: familyDetailsArray
    });
  } catch (err) {
    await transaction.rollback();
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateFamilyMemberDetails = async (req, res) => {
  const { family_member_id, first_name, middle_name, last_name, dob } = req.body;

  try {
    const familyMember = await FamilyDetails.findOne({ where: { id: family_member_id, user_id: req.user.id } });
    if (!familyMember) {
      return res.status(404).json({ message: 'Family member not found or not associated with the user', error_code: 404 });
    }

    familyMember.first_name = first_name;
    familyMember.middle_name = middle_name;
    familyMember.last_name = last_name;
    familyMember.dob = dob;
    await familyMember.save();

    // Fetch updated family details
    const family_details = await FamilyDetails.findAll({ where: { user_id: req.user.id } });

    // Fetch updated user details
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      name: updatedUser.name,
      email: updatedUser.email,
      dob: updatedUser.dob,
      office_amount: updatedUser.office_amount,
      additional_amount: updatedUser.additional_amount,
      amount_payable: updatedUser.amount_payable,
      payment_status: updatedUser.payment_status,
      is_family_included: updatedUser.is_family_included,
      adults_count: updatedUser.adults_count,
      kids_count: updatedUser.kids_count,
      infants_count: updatedUser.infants_count,
      family_details
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
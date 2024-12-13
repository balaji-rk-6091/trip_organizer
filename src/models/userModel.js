const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const FamilyDetails = require('./familyDetailsModel');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  office_amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  additional_amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  amount_payable: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  payment_status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  is_family_included: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  adults_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  kids_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  infants_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

User.hasMany(FamilyDetails, { as: 'family_details', foreignKey: 'user_id' });
FamilyDetails.belongsTo(User, { foreignKey: 'user_id' });

module.exports = User;
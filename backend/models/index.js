/**
 * Models Index
 * Central export point for all Mongoose models
 */

const User = require('./User');
const Question = require('./Question');
const Audit = require('./Audit');
const Category = require('./Category');
const AuditLog = require('./AuditLog');

module.exports = {
  User,
  Question,
  Audit,
  Category,
  AuditLog
};

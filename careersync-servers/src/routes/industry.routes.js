const express = require('express');
const router = express.Router();
const { Industry } = require('../models');
const authMiddleware = require('../middleware/auth');

/**
 * PUBLIC ROUTES
 * These endpoints are public for users to browse industries
 */

// GET all industries (Public)
router.get('/', async (req, res) => {
  try {
    const industries = await Industry.findAll({
      attributes: ['id', 'industry_name', 'created_at'],
      order: [['industry_name', 'ASC']]
    });
    
    res.json(industries);
  } catch (error) {
    console.error('Get industries error:', error);
    res.status(500).json({ message: 'Error fetching industries' });
  }
});

// GET single industry by ID (Public)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const industry = await Industry.findByPk(id, {
      attributes: ['id', 'industry_name', 'created_at']
    });
    
    if (!industry) {
      return res.status(404).json({ message: 'Industry not found' });
    }
    
    res.json(industry);
  } catch (error) {
    console.error('Get industry error:', error);
    res.status(500).json({ message: 'Error fetching industry' });
  }
});

/**
 * ADMIN-ONLY ROUTES
 * These should be handled by admin-management.routes.js
 * But included here for backward compatibility
 */

// POST create industry (Admin only)
// NOTE: This should ideally be in admin-management routes
router.post('/', authMiddleware, async (req, res) => {
  const { industry_name } = req.body;
  
  // Only admins can create
  if (req.user.role_name !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  if (!industry_name) {
    return res.status(400).json({ message: 'Industry name is required' });
  }
  
  try {
    const industry = await Industry.create({ 
      industry_name: industry_name.trim()
    });
    
    res.status(201).json({
      message: 'Industry created successfully',
      industry
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Industry already exists' });
    }
    console.error('Create industry error:', error);
    res.status(500).json({ message: 'Error creating industry' });
  }
});

// PUT update industry (Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { industry_name } = req.body;
  
  // Only admins can update
  if (req.user.role_name !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  if (!industry_name) {
    return res.status(400).json({ message: 'Industry name is required' });
  }
  
  try {
    const industry = await Industry.findByPk(id);
    
    if (!industry) {
      return res.status(404).json({ message: 'Industry not found' });
    }
    
    industry.industry_name = industry_name.trim();
    await industry.save();
    
    res.json({
      message: 'Industry updated successfully',
      industry
    });
  } catch (error) {
    console.error('Update industry error:', error);
    res.status(500).json({ message: 'Error updating industry' });
  }
});

// DELETE industry (Admin only - soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  // Only admins can delete
  if (req.user.role_name !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  try {
    const industry = await Industry.findByPk(id);
    
    if (!industry) {
      return res.status(404).json({ message: 'Industry not found' });
    }
    
    // Check if industry has positions (prevent deletion)
    const { Position } = require('../models');
    const positionsCount = await Position.count({ where: { industry_id: id } });
    
    if (positionsCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete industry. It has ${positionsCount} position(s) associated with it.` 
      });
    }
    
    // Soft delete (sets deleted_at timestamp)
    await industry.destroy();
    
    res.json({ 
      message: 'Industry deleted successfully',
      industry_id: id
    });
  } catch (error) {
    console.error('Delete industry error:', error);
    res.status(500).json({ message: 'Error deleting industry' });
  }
});

module.exports = router;

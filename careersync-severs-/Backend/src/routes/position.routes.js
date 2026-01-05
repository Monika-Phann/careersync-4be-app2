const express = require('express');
const router = express.Router();
const { Position, Industry } = require('../models');
const authMiddleware = require('../middleware/auth');

const APP_URL = process.env.APP_URL;
if (!APP_URL) throw new Error('APP_URL environment variable is required');

/**
 * PUBLIC ROUTES
 * These endpoints are public for users to browse positions
 */

// GET all positions (Public)
// Can filter by industry_id: /positions?industry_id=uuid
router.get('/', async (req, res) => {
  const { industry_id } = req.query;
  
  try {
    const where = {};
    if (industry_id) {
      where.industry_id = industry_id;
    }
    
    const positions = await Position.findAll({
      where,
      attributes: ['id', 'position_name', 'description', 'industry_id', 'image_position', 'created_at'],
      include: [
        {
          model: Industry,
          attributes: ['industry_name']
        }
      ],
      order: [['position_name', 'ASC']]
    });
    
    // Format response with image URLs (handle both R2 URLs and legacy paths)
    const formatted = positions.map(p => ({
      id: p.id,
      position_name: p.position_name,
      description: p.description,
      industry_id: p.industry_id,
      industry_name: p.Industry?.industry_name,
      image_url: p.image_position 
        ? (p.image_position.startsWith('http') 
            ? p.image_position 
            : `${APP_URL}${p.image_position}`)
        : null,
      created_at: p.created_at
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ message: 'Error fetching positions' });
  }
});

// GET single position by ID (Public)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const position = await Position.findByPk(id, {
      attributes: ['id', 'position_name', 'description', 'industry_id', 'image_position', 'created_at'],
      include: [
        {
          model: Industry,
          attributes: ['industry_name']
        }
      ]
    });
    
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }
    
    // Format response (handle both R2 URLs and legacy paths)
    const formatted = {
      id: position.id,
      position_name: position.position_name,
      description: position.description,
      industry_id: position.industry_id,
      industry_name: position.Industry?.industry_name,
      image_url: position.image_position 
        ? (position.image_position.startsWith('http') 
            ? position.image_position 
            : `${APP_URL}${position.image_position}`)
        : null,
      created_at: position.created_at
    };
    
    res.json(formatted);
  } catch (error) {
    console.error('Get position error:', error);
    res.status(500).json({ message: 'Error fetching position' });
  }
});

// GET positions by industry (Public)
router.get('/industry/:industry_id', async (req, res) => {
  const { industry_id } = req.params;
  
  try {
    const positions = await Position.findAll({
      where: { industry_id },
      attributes: ['id', 'position_name', 'description', 'image_position'],
      order: [['position_name', 'ASC']]
    });
    
    // Format with image URLs (handle both R2 URLs and legacy paths)
    const formatted = positions.map(p => ({
      id: p.id,
      position_name: p.position_name,
      description: p.description,
      image_url: p.image_position 
        ? (p.image_position.startsWith('http') 
            ? p.image_position 
            : `${APP_URL}${p.image_position}`)
        : null
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Get positions by industry error:', error);
    res.status(500).json({ message: 'Error fetching positions' });
  }
});

/**
 * ADMIN-ONLY ROUTES
 * These should be handled by admin-management.routes.js
 * But included here for backward compatibility
 */

// POST create position (Admin only)
// NOTE: This should ideally be in admin-management routes
// This endpoint does NOT handle file upload - use admin-management routes for that
router.post('/', authMiddleware, async (req, res) => {
  const { industry_id, position_name, description } = req.body;
  
  // Only admins can create
  if (req.user.role_name !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  if (!industry_id || !position_name) {
    return res.status(400).json({ message: 'industry_id and position_name are required' });
  }
  
  try {
    // Verify industry exists
    const industry = await Industry.findByPk(industry_id);
    if (!industry) {
      return res.status(404).json({ message: 'Industry not found' });
    }
    
    const position = await Position.create({
      industry_id,
      position_name: position_name.trim(),
      description: description || null,
      image_position: null // No file upload in this route
    });
    
    // Return with industry name
    const created = await Position.findByPk(position.id, {
      include: [{ model: Industry, attributes: ['industry_name'] }]
    });
    
    res.status(201).json({
      message: 'Position created successfully',
      position: created
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Position already exists in this industry' });
    }
    console.error('Create position error:', error);
    res.status(500).json({ message: 'Error creating position' });
  }
});

// PUT update position (Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { industry_id, position_name, description } = req.body;
  
  // Only admins can update
  if (req.user.role_name !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  try {
    const position = await Position.findByPk(id);
    
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }
    
    // Verify industry if provided
    if (industry_id) {
      const industry = await Industry.findByPk(industry_id);
      if (!industry) {
        return res.status(404).json({ message: 'Industry not found' });
      }
      position.industry_id = industry_id;
    }
    
    if (position_name) position.position_name = position_name.trim();
    if (description !== undefined) position.description = description;
    
    await position.save();
    
    // Return with industry
    const updated = await Position.findByPk(id, {
      include: [{ model: Industry, attributes: ['industry_name'] }]
    });
    
    res.json({
      message: 'Position updated successfully',
      position: updated
    });
  } catch (error) {
    console.error('Update position error:', error);
    res.status(500).json({ message: 'Error updating position' });
  }
});

// DELETE position (Admin only - soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  // Only admins can delete
  if (req.user.role_name !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  try {
    const position = await Position.findByPk(id);
    
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }
    
    // Check if position has mentors (prevent deletion)
    const { Mentor } = require('../models');
    const mentorsCount = await Mentor.count({ where: { position_id: id } });
    
    if (mentorsCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete position. It has ${mentorsCount} mentor(s) associated with it.` 
      });
    }
    
    // Soft delete
    await position.destroy();
    
    res.json({ 
      message: 'Position deleted successfully',
      position_id: id
    });
  } catch (error) {
    console.error('Delete position error:', error);
    res.status(500).json({ message: 'Error deleting position' });
  }
});

module.exports = router;

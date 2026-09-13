const express = require('express');
const router = express.Router();
const Donor = require('../models/Donor');

// CREATE - Register a new donor
router.post('/', async (req, res) => {
  try {
    const donor = new Donor(req.body);
    const savedDonor = await donor.save();
    res.status(201).json(savedDonor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ - Get all donors, with optional filters (?bloodGroup=&city=)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;
    if (req.query.city) filter.city = new RegExp(req.query.city, 'i');
    if (req.query.available !== undefined) filter.available = req.query.available === 'true';

    const donors = await Donor.find(filter).sort({ createdAt: -1 });
    res.json(donors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ - Get a single donor by id
router.get('/:id', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ error: 'Donor not found' });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE - Update donor details / availability
router.put('/:id', async (req, res) => {
  try {
    const updatedDonor = await Donor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedDonor) return res.status(404).json({ error: 'Donor not found' });
    res.json(updatedDonor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE - Remove a donor
router.delete('/:id', async (req, res) => {
  try {
    const deletedDonor = await Donor.findByIdAndDelete(req.params.id);
    if (!deletedDonor) return res.status(404).json({ error: 'Donor not found' });
    res.json({ message: 'Donor deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

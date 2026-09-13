const express = require('express');
const router = express.Router();
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');

// CREATE - Raise a new blood request
router.post('/', async (req, res) => {
  try {
    const request = new BloodRequest(req.body);
    const savedRequest = await request.save();
    res.status(201).json(savedRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ - Get all requests, with optional filters (?bloodGroup=&status=&city=)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.city) filter.city = new RegExp(req.query.city, 'i');

    const requests = await BloodRequest.find(filter)
      .populate('assignedDonor', 'name phone bloodGroup city')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ - Get a single request by id
router.get('/:id', async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id).populate(
      'assignedDonor',
      'name phone bloodGroup city'
    );
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE - Update request status (Pending / Fulfilled / Cancelled)
router.put('/:id', async (req, res) => {
  try {
    const updatedRequest = await BloodRequest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedRequest) return res.status(404).json({ error: 'Request not found' });
    res.json(updatedRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ASSIGN - Link a donor to a request, marks request Fulfilled and donor unavailable
router.put('/:id/assign', async (req, res) => {
  try {
    const { donorId } = req.body;
    if (!donorId) return res.status(400).json({ error: 'donorId is required' });

    const donor = await Donor.findById(donorId);
    if (!donor) return res.status(404).json({ error: 'Donor not found' });

    const updatedRequest = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      { assignedDonor: donorId, status: 'Fulfilled' },
      { new: true, runValidators: true }
    ).populate('assignedDonor', 'name phone bloodGroup city');

    if (!updatedRequest) return res.status(404).json({ error: 'Request not found' });

    // Donor who just donated is marked unavailable until they recover
    donor.available = false;
    donor.lastDonationDate = new Date();
    await donor.save();

    res.json(updatedRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UNASSIGN - Remove donor link and revert request to Pending
router.put('/:id/unassign', async (req, res) => {
  try {
    const updatedRequest = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      { assignedDonor: null, status: 'Pending' },
      { new: true }
    );
    if (!updatedRequest) return res.status(404).json({ error: 'Request not found' });
    res.json(updatedRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE - Remove a request
router.delete('/:id', async (req, res) => {
  try {
    const deletedRequest = await BloodRequest.findByIdAndDelete(req.params.id);
    if (!deletedRequest) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Request deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

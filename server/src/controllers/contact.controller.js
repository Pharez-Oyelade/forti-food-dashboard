import { Contact } from '../models/Contact.js';
import { Lead } from '../models/Lead.js';

export const listContacts = async (req, res, next) => {
  try {
    const filter = req.rbacFilter || {};
    // Exclude converted contacts by default, unless explicitly requested
    if (req.query.include_converted !== 'true') {
      filter.is_converted_to_lead = false;
    }

    const contacts = await Contact.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: contacts });
  } catch (err) {
    next(err);
  }
};

export const createContact = async (req, res, next) => {
  try {
    // If not assigning to a specific user, default to the creator
    const owner = req.body.owner || req.user._id;

    const contact = await Contact.create({
      ...req.body,
      owner,
    });

    const populated = await Contact.findById(contact._id).populate('owner', 'name email');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, ...req.rbacFilter });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    Object.assign(contact, req.body);
    await contact.save();

    const populated = await Contact.findById(contact._id).populate('owner', 'name email');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, ...req.rbacFilter });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

export const convertToLead = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, ...req.rbacFilter });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    if (contact.is_converted_to_lead) {
      return res.status(400).json({ success: false, message: 'Contact is already converted to a lead' });
    }

    // Map Contact fields to new Lead
    const newLead = await Lead.create({
      lead_name: contact.company_name, // Typically lead_name is the company name initially
      company: contact.company_name,
      lead_source: contact.customer_source,
      owner: contact.owner,
      lead_stage: 'New', // Start fresh in pipeline
    });

    contact.is_converted_to_lead = true;
    contact.converted_lead_id = newLead._id;
    await contact.save();

    res.json({ success: true, data: { contact, lead: newLead } });
  } catch (err) {
    next(err);
  }
};
